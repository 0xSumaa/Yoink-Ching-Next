/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from "frog";
import { ethers } from "ethers";
import YoinkABI from "./constants/yoinkabi.json";
import MoxieABI from "./constants/erc20abi.json";
import { devtools } from "frog/dev";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { getBalance, getGameState, getHolderState } from "./utils/fetch-data";
import { neynar } from "frog/middlewares";
import { config } from "dotenv";
import { adjustBalance, formatBalance } from "./utils/format";
import { checkRateLimit } from "./utils/rate-limit";
import { calculateMultiplier } from "./utils/math";

config();

type State = {
  holderAddy: string;
  contractBalance: string;
  userBalance: string;
  gameInProgress: boolean;
  timeHeld: string;
  timeLeft: string;
};

const app = new Frog<{ State: State }>({
  initialState: {
    holderAddy: "0x",
    contractBalance: "0",
    userBalance: "0",
    gameInProgress: true,
    timeHeld: "0 minutes",
    timeLeft: "24 hours",
  },
  assetsPath: "/",
  basePath: "/api",
  title: "Yoink-Ching",
  browserLocation: "https://warpcast.com/sumaa",
}).use(
  neynar({
    apiKey: process.env.NEYNAR_FROG_FM as string,
    features: ["interactor"],
  })
);
// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame("/", async (c) => {
  try {
    const { holderAddy, contractBalance, gameInProgress } =
      await getGameState();

    return c.res({
      image: (
        <div
          style={{
            alignItems: "center",
            background: "white",
            backgroundSize: "100% 100%",
            display: "flex",
            flexDirection: "column",
            flexWrap: "nowrap",
            height: "100%",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
          }}
        >
          {gameInProgress ? (
            <>
              <div
                style={{
                  color: "red",
                  fontSize: 124,
                  fontStyle: "normal",
                  letterSpacing: "-0.025em",
                  display: "flex",
                  lineHeight: 1.4,
                  marginTop: 30,
                  padding: "0 120px",
                  whiteSpace: "pre-wrap",
                }}
              >
                Yoink-Ching!
              </div>
              <div
                style={{
                  color: "black",
                  fontSize: 36,
                  fontStyle: "normal",
                  letterSpacing: "-0.025em",
                  display: "flex",
                  lineHeight: 1.4,
                  marginTop: 10,
                  padding: "0 120px",
                  whiteSpace: "pre-wrap",
                }}
              >
                yoink and hodl for 24 hours to win{" "}
                {formatBalance(contractBalance)} MOXIE
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  color: "red",
                  fontSize: 72,
                  fontStyle: "normal",
                  letterSpacing: "-0.025em",
                  display: "flex",
                  lineHeight: 1.4,
                  marginTop: 30,
                  padding: "0 120px",
                  whiteSpace: "pre-wrap",
                }}
              >
                Game Has Ended!
              </div>
              <div
                style={{
                  color: "black",
                  fontSize: 36,
                  fontStyle: "normal",
                  letterSpacing: "-0.025em",
                  display: "flex",
                  lineHeight: 1.4,
                  marginTop: 10,
                  padding: "0 120px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {holderAddy} won
              </div>
            </>
          )}
        </div>
      ),
      intents: [
        gameInProgress ? (
          <Button action="/intro">🚀 Start</Button>
        ) : (
          <Button.Transaction target="/claim" action="/claimed">
            {" "}
            Claim MOXIE{" "}
          </Button.Transaction>
        ),
      ],
    });
  } catch (error) {
    console.log("error", error);
    return c.error({
      message: "Error loading data",
      statusCode: 400,
    });
  }
});

app.frame("/intro", async (c) => {
  try {
    const fid = c.var.interactor?.fid;

    if (!fid) {
      return c.error({
        message: "Error fetching fid",
        statusCode: 400,
      });
    }

    const canProceed = await checkRateLimit(fid.toString());

    if (!canProceed) {
      return c.res({
        image: (
          <div
            style={{
              alignItems: "center",
              background: "white",
              backgroundSize: "100% 100%",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
              textAlign: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                color: "red",
                fontSize: 48,
                fontStyle: "normal",
                letterSpacing: "-0.025em",
                lineHeight: 1.4,
                padding: "0 120px",
                whiteSpace: "pre-wrap",
              }}
            >
              You are Yoinking too much ser! One yoink every 10 minutes.
            </div>
          </div>
        ),
        intents: [<Button action="/">Go Back</Button>],
      });
    }

    const walletAddress =
      (c.var.interactor?.verifications?.[0] as string) ||
      (c.var.interactor?.custodyAddress as string);
    const { holderState, contractBalance, userBalance, sufficientApproval } =
      await getHolderState(walletAddress);
    c.deriveState((previousState) => {
      previousState.contractBalance = contractBalance;
      previousState.userBalance = userBalance;
    });
    return c.res({
      image: (
        <div
          style={{
            alignItems: "center",
            background: "white",
            backgroundSize: "100% 100%",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            position: "relative", // Added to position the balance display
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              color: "black",
              display: "flex",
              fontSize: 24,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              lineHeight: 1.4,
            }}
          >
            balance: {formatBalance(userBalance)} MOXIE
          </div>
          <div
            style={{
              color: "green",
              fontSize: 64,
              fontStyle: "normal",
              display: "flex",
              letterSpacing: "-0.025em",
              lineHeight: 1.4,
              padding: "0 120px",
              whiteSpace: "pre-wrap",
            }}
          >
            {holderState.holder} has the flag
          </div>
          <div
            style={{
              color: "black",
              fontSize: 36,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              display: "flex",
              lineHeight: 1.4,
              marginTop: 20,
              padding: "0 120px",
              whiteSpace: "pre-wrap",
            }}
          >
            since {holderState.timeHeld}
          </div>
          <div
            style={{
              color: "black",
              fontSize: 36,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              display: "flex",
              lineHeight: 1.4,
              marginTop: 20,
              padding: "0 120px",
              whiteSpace: "pre-wrap",
            }}
          >
            {holderState.timeLeft} left before winning{" "}
            {formatBalance(contractBalance)} MOXIE
          </div>
        </div>
      ),
      intents: [
        sufficientApproval ? (
          <Button.Transaction target="/yoink-flag" action="/yoinked">
            Yoink for 10 MOXIE 😈
          </Button.Transaction>
        ) : (
          <Button.Transaction target="/approve" action="/yoink">
            Approve MOXIE to Yoink
          </Button.Transaction>
        ),
      ],
    });
  } catch (error) {
    console.log("error", error);
    return c.error({
      message: "Error loading data",
      statusCode: 400,
    });
  }
});

app.frame("/yoink", async (c) => {
  try {
    const { contractBalance, userBalance } = c.previousState;

    return c.res({
      image: (
        <div
          style={{
            alignItems: "center",
            background: "white",
            backgroundSize: "100% 100%",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              color: "black",
              display: "flex",
              fontSize: 24,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              lineHeight: 1.4,
            }}
          >
            balance: {formatBalance(userBalance)} MOXIE
          </div>
          <div
            style={{
              color: "green",
              fontSize: 72,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              lineHeight: 1.4,
              padding: "0 120px",
              whiteSpace: "pre-wrap",
            }}
          >
            Approved, Now Yoink!
          </div>
          <div
            style={{
              color: "black",
              fontSize: 36,
              fontStyle: "normal",
              display: "flex",
              letterSpacing: "-0.025em",
              lineHeight: 1.4,
              padding: "0 120px",
              whiteSpace: "pre-wrap",
            }}
          >
            yoink and hodl for 24 hours to win {formatBalance(contractBalance)}{" "}
            MOXIE
          </div>
        </div>
      ),
      intents: [
        <Button.Transaction target="/yoink-flag" action="/yoinked">
          Yoink for 10 MOXIE 😈
        </Button.Transaction>,
      ],
    });
  } catch (error) {
    return c.error({
      message: "Error Yoinking",
      statusCode: 400,
    });
  }
});

app.frame("/yoinked", async (c) => {
  try {
    const adjustedBalance = adjustBalance(
      await getBalance(process.env.YOINK_ADDRESS as string)
    );
    const multiplier = calculateMultiplier(adjustedBalance.toString(), 10);
    const backgroundImageUrl = "https://i.ibb.co/6NzyKtx/88we6ih803w21.png";
    return c.res({
      image: (
        <div
          style={{
            alignItems: "center",
            background: "white",
            backgroundSize: "100% 100%",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            backgroundImage: `url('${backgroundImageUrl}')`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              color: "black",
              fontSize: 96,
              fontWeight: "bold",
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              lineHeight: 1.4,
              padding: "0 120px",
              whiteSpace: "pre-wrap",
            }}
          >
            Yoinked!
          </div>
          <div
            style={{
              color: "black",
              fontSize: 48,
              fontWeight: "bold",
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              display: "flex",
              lineHeight: 1.4,
              marginTop: 20,
              padding: "0 120px",
              whiteSpace: "pre-wrap",
            }}
          >
            hodling for 24 hours yields {multiplier}x
          </div>
        </div>
      ),
      intents: [],
    });
  } catch (error) {
    return c.error({
      message: "Yoinked, but error fetching completion screen",
      statusCode: 400,
    });
  }
});

app.frame("/claimed", async (c) => {
  const balance = await getBalance(process.env.YOINK_ADDRESS as string);
  return c.res({
    image: (
      <div
        style={{
          alignItems: "center",
          background: "white",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "100%",
          justifyContent: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "green",
            fontSize: 72,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            display: "flex",
            lineHeight: 1.4,
            marginTop: 30,
            padding: "0 120px",
            whiteSpace: "pre-wrap",
          }}
        >
          You won {formatBalance(balance)} MOXIE!
        </div>
      </div>
    ),
    intents: [],
  });
});

app.transaction("/approve", (c) => {
  return c.contract({
    abi: MoxieABI,
    functionName: "approve",
    args: [process.env.YOINK_ADDRESS as `0x${string}`, ethers.MaxUint256],
    chainId: "eip155:8453",
    to: process.env.MOXIE_ADDRESS as `0x${string}`,
    value: BigInt(0),
  });
});

app.transaction("/yoink-flag", (c) => {
  return c.contract({
    abi: YoinkABI,
    functionName: "yoink",
    args: [],
    chainId: "eip155:8453",
    to: process.env.YOINK_ADDRESS as `0x${string}`,
    value: BigInt(0),
  });
});

app.transaction("/claim", (c) => {
  return c.contract({
    abi: YoinkABI,
    functionName: "yoink",
    args: [],
    chainId: "eip155:8453",
    to: process.env.YOINK_ADDRESS as `0x${string}`,
    value: BigInt(0),
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);

// NOTE: That if you are using the devtools and enable Edge Runtime, you will need to copy the devtools
// static assets to the public folder. You can do this by adding a script to your package.json:
// ```json
// {
//   scripts: {
//     "copy-static": "cp -r ./node_modules/frog/_lib/ui/.frog ./public/.frog"
//   }
// }
// ```
// Next, you'll want to set up the devtools to use the correct assets path:
// ```ts
// devtools(app, { assetsPath: '/.frog' })
// ```
