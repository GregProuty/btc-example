// @ts-ignore
import RootLayout from "../layout";
import "../styles/globals.css";
// @ts-ignore
import BackgroundPatternX from '../components/BackgroundPatternX'

export default function MyApp({ Component, pageProps }) {
  return (
    <RootLayout>
      <BackgroundPatternX />
      <Component {...pageProps} />
    </RootLayout>
  );
}