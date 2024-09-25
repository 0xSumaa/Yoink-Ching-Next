import { formatBalance } from "../utils/format";

const ClaimedImage = ({ balance }: { balance: string }) => (
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
);

export default ClaimedImage;
