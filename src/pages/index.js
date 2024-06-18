import { useStore } from "@/layout";
import { generateAddress } from '../helpers/kdf'
import styles from "@/styles/app.module.css";
import bitcoin from '../helpers/bitcoin.js'
import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from "react-hook-form"

const MPC_PUBLIC_KEY = process.env.MPC_PUBLIC_KEY

export default function Home() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()
  const { signedAccountId } = useStore();
  const [balance, setBalance] = useState('')
  const [address, setAddress] = useState('')
  const [publicKey, setPublicKey] = useState('')

  
  const onSubmit = (data) => {
    console.log(data)
    sendBtc(data.to, data.amount)
  }

  console.log(signedAccountId)

  useEffect(() => {
    const getAddress = async () => {
      const struct = await generateAddress({
        publicKey: MPC_PUBLIC_KEY,
        accountId: signedAccountId,
        path: 'bitcoin,1',
        chain: 'bitcoin'
      })
      console.log('struct', struct)
      setAddress(struct.address)
      setPublicKey(struct.publicKey)
      checkBal()
    } 
    getAddress()
  }, [signedAccountId])

  useEffect(() => {
    checkBal()
  }, [signedAccountId, address])

  const sendBtc = async (to, amount) => {

    const response = await bitcoin.send({
      from: address,
      publicKey: publicKey,
      to,
      amount
    })

    console.log('response', response)
  }
  const checkBal = async () => {
    const response = await bitcoin.getBalance({
      address: address,
    })
    if (response) setBalance(response)
  }

  return (
    <main className={styles.main}>
      <div className={"flex border justify-center min-w-[30em] max-w-[30em] w-[50vw] h-[50vh] bg-white rounded-xl shadow-xl p-4 mt-24"} style={{ display: 'flex', flexDirection: 'column' }}>
        <p>{`Address:`}</p>
        <input className="border p-1 rounded bg-slate-500 text-white pl-4" defaultValue={address} disabled />

        {/* <button className={'bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md border w-48'}  onClick={() => checkBal()}>CHECK BALANCE</button> */}
        <p onClick={() => checkBal()}>{`Balance:`}</p>
        <input className="border p-1 rounded bg-slate-500 text-white pl-4" defaultValue={balance} disabled />

        <div className="flex flex-col">
        <form className="flex flex-col mt-8" onSubmit={handleSubmit(onSubmit)}>
          {/* register your input into the hook by invoking the "register" function */}
          <p>To Address:</p>
          <input className="border p-1 rounded bg-slate-700 text-white pl-4" placeholder="To Address" {...register("to")} />

          {/* include validation with required or other standard HTML validation rules */}
          <p>Value:</p>
          <input className="border p-1 rounded bg-slate-700 text-white pl-4" placeholder="Value" {...register("amount", { required: true })} />
          {/* errors will return when field validation fails  */}
          {errors.exampleRequired && <span>This field is required</span>}

          <input className={'mt-4 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md border w-48 mb-2 cursor-pointer'} type="submit" />
        </form>
        </div>
        {/* <button className={'bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-md border w-48 mb-2'} onClick={() => asyncfunc()}>SEND BTC</button> */}
      </div>
    </main>
  );
}