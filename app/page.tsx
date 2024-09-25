import { getFrameMetadata } from "frog/next";
import type { Metadata } from "next";
import { fetchBalance } from "./api/[[...routes]]/utils/on-chain-data";
import styles from "./page.module.css";
import { formatBalance } from "./api/[[...routes]]/utils/format";
import { config } from "dotenv";
config();
export async function generateMetadata(): Promise<Metadata> {
  const frameTags = await getFrameMetadata(
    `${process.env.VERCEL_URL || "http://localhost:3000"}/api`
  );
  return {
    other: frameTags,
  };
}

export default async function Home() {
  const balance = await fetchBalance(process.env.YOINK_ADDRESS as string);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Yoink-Ching!</h1>
      <h2 className={styles.prizePool}>
        Current Prize Pool: {formatBalance(balance)} MOXIE
      </h2>
      <div className={styles.linksTitle}>Links</div>
      <div className={styles.links}>
        <a href="https://warpcast.com/sumaa/0x2769eec9">Yoink On Warpcast</a>
        <a href="https://github.com/0xSumaa/Yoink-Ching-Contracts">
          Contracts Github
        </a>
        <a href="https://github.com/0xSumaa/Yoink-Ching">Frame Github</a>
        <a href="https://basescan.org/">Basescan</a>
      </div>
    </div>
  );
}
