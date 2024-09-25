/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
// import { neynar } from 'frog/hubs'
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { getGameState } from "./utils/fetch-data";
import { neynar } from "frog/middlewares";
import { config } from "dotenv";
import { formatBalance } from "./utils/format";

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
        // gameInProgress ? (
        <Button action="/intro">🚀 Start</Button>,
        // ) : (
        //   <Button.Transaction target="/claim" action="/claimed">
        //     {" "}
        //     Claim MOXIE{" "}
        //   </Button.Transaction>
        // ),
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
    const { deriveState, previousState } = c;

    console.log("Updated State:", previousState); // Log the updated state

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
            balance: {formatBalance(previousState.userBalance)} MOXIE
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
            {previousState.holderAddy} has the flag
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
            since {previousState.timeHeld}
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
            {previousState.timeLeft}
          </div>
        </div>
      ),
      intents: [],
    });
  } catch (error) {
    return c.error({
      message: "Error loading data",
      statusCode: 400,
    });
  }
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
