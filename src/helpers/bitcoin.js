import { ethers } from 'ethers';
import { fetchJson } from './utils';
import { sign } from './near';
import * as bitcoinJs from 'bitcoinjs-lib';
console.log('ethers', ethers)


const bitcoin = {
  name: 'Bitcoin Testnet',
  currency: 'sats',
  explorer: 'https://blockstream.info/testnet',
  getBalance: async ({ address, getUtxos = false }) => {
    try {

    const res = await fetchJson(
      `https://blockstream.info/testnet/api/address/${address}/utxo`,
    );

    if (!res) return

    let utxos = res.map((utxo) => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
    }));
    // ONLY RETURNING AND SIGNING LARGEST UTXO
    // WHY?
    // For convenience in client side, this will only require 1 Near signature for 1 Bitcoin TX.
    // Solutions for signing multiple UTXOs using MPC with a single Near TX are being worked on.
    let maxValue = 0;
    utxos.forEach((utxo) => {
      if (utxo.value > maxValue) maxValue = utxo.value;
    });
    utxos = utxos.filter((utxo) => utxo.value === maxValue);

    if (!utxos || !utxos.length) {
      console.log(
        'no utxos for address',
        address,
        'please fund address and try again',
      );
    }

    return getUtxos ? utxos : maxValue;
  } catch (e) {
    console.log('e', e)
  }
  },
  send: async ({
    from: address,
    publicKey,
    to = 'mkB9PV9YcKiLNbf3v8h1TRo863WDAdUkJn',
    amount = '1',
  }) => {
    if (!address) return console.log('must provide a sending address');
    const { getBalance, explorer, currency } = bitcoin;
    const sats = parseInt(amount);

    // get utxos
    const utxos = await getBalance({ address, getUtxos: true });

    if (!utxos) return
    // check balance (TODO include fee in check)
    if (utxos[0].value < sats) {
      return console.log('insufficient funds');
    }

    const psbt = new bitcoinJs.Psbt({ network: bitcoinJs.networks.testnet });
    let totalInput = 0;
    await Promise.all(
      utxos.map(async (utxo) => {
        totalInput += utxo.value;

        const transaction = await fetchTransaction(utxo.txid);
        let inputOptions;
        if (transaction.outs[utxo.vout].script.includes('0014')) {
          inputOptions = {
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              script: transaction.outs[utxo.vout].script,
              value: utxo.value,
            },
          };
        } else {
          inputOptions = {
            hash: utxo.txid,
            index: utxo.vout,
            nonWitnessUtxo: Buffer.from(transaction.toHex(), 'hex'),
          };
        }

        psbt.addInput(inputOptions);
      }),
    );

    psbt.addOutput({
      address: to,
      value: sats,
    });

    // calculate fee
    const feeRate = await fetchJson(`${bitcoinRpc}/fee-estimates`);
    const estimatedSize = utxos.length * 148 + 2 * 34 + 10;
    const fee = estimatedSize * (feeRate[6] + 3);
    const change = totalInput - sats - fee;

    if (change > 0) {
      psbt.addOutput({
        address: address,
        value: change,
      });
    }

    // keyPair object required by psbt.signInputAsync(index, keyPair)
    const keyPair = {
      publicKey: Buffer.from(publicKey, 'hex'),
      sign: async (transactionHash) => {
        const payload = Object.values(ethers.utils.arrayify(transactionHash));
        const sig = await sign(payload, "bitcoin,1");

        if (!sig) return;

        return Buffer.from(sig.r + sig.s, 'hex');
      },
    };

    await Promise.all(
      utxos.map(async (_, index) => {
        console.log(index)
        try {
          console.log('got here !!!')
          await psbt.signInputAsync(index, keyPair);
        } catch (e) {
          console.warn(e, 'not signed');
        }
      }),
    );

    psbt.finalizeAllInputs();

    // broadcast tx
    try {
      console.log('blockstream body',  psbt.extractTransaction().toHex())
      const res = await fetch(`https://corsproxy.io/?${bitcoinRpc}/tx`, {
        method: 'POST',
        body: psbt.extractTransaction().toHex(),
      });
      if (res.status === 200) {
        const hash = await res.text();
        console.log('tx hash', hash);
        console.log('explorer link', `${explorer}/tx/${hash}`);
        console.log(
          'NOTE: it might take a minute for transaction to be included in mempool',
        );
      }
      return res
    } catch (e) {
      console.log('error broadcasting bitcoin tx', JSON.stringify(e));
    }
  },
};

export default bitcoin;

const bitcoinRpc = `https://blockstream.info/testnet/api`;
async function fetchTransaction(transactionId) {
  const data = await fetchJson(`${bitcoinRpc}/tx/${transactionId}`);
  const tx = new bitcoinJs.Transaction();

  tx.version = data.version;
  tx.locktime = data.locktime;

  data.vin.forEach((vin) => {
    const txHash = Buffer.from(vin.txid, 'hex').reverse();
    const vout = vin.vout;
    const sequence = vin.sequence;
    const scriptSig = vin.scriptsig
      ? Buffer.from(vin.scriptsig, 'hex')
      : undefined;
    tx.addInput(txHash, vout, sequence, scriptSig);
  });

  data.vout.forEach((vout) => {
    const value = vout.value;
    const scriptPubKey = Buffer.from(vout.scriptpubkey, 'hex');
    tx.addOutput(scriptPubKey, value);
  });

  data.vin.forEach((vin, index) => {
    if (vin.witness && vin.witness.length > 0) {
      const witness = vin.witness.map((w) => Buffer.from(w, 'hex'));
      tx.setWitness(index, witness);
    }
  });

  return tx;
}
