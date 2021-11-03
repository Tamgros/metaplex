import React from "react";

import {
  Button,
  FormControl,
  InputLabel,
  Link as HyperLink,
  MenuItem,
  Stack,
  Select,
  TextField,
} from "@mui/material";

import {
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  Keypair,
} from "@solana/web3.js";

import {
  useConnection,
  Connection,
} from "../contexts";
import {
  notify,
} from "../utils";
import {
  closeGumdrop,
} from "../utils/claimant";
import {
  explorerLinkFor,
} from "../utils/transactions";

export const Close = () => {
  const connection = useConnection();
  const wallet = useWallet();

  const [baseKey, setBaseKey] = React.useState("");
  const [claimMethod, setClaimMethod] = React.useState(localStorage.getItem("claimMethod") || "transfer");
  const [candyConfig, setCandyConfig] = React.useState(localStorage.getItem("candyConfig") || "");
  const [candyUUID, setCandyUUID] = React.useState(localStorage.getItem("candyUUID") || "");
  const [masterMint, setMasterMint] = React.useState(localStorage.getItem("masterMint") || "");

  const submit = async (e : React.SyntheticEvent) => {
    e.preventDefault();

    if (!wallet.connected || wallet.publicKey === null) {
      throw new Error(`Wallet not connected`);
    }

    const base = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(baseKey)));

    const instructions = await closeGumdrop(
      connection,
      wallet.publicKey,
      base,
      claimMethod,
      candyConfig,
      candyUUID,
      masterMint,
    );

    const closeResult = await Connection.sendTransactionWithRetry(
      connection,
      wallet,
      instructions,
      [base]
    );

    console.log(closeResult);
    if (typeof closeResult === "string") {
      notify({
        message: "Close failed",
        description: closeResult,
      });
    } else {
      notify({
        message: "Close succeeded",
        description: (
          <HyperLink href={explorerLinkFor(closeResult.txid, connection)}>
            View transaction on explorer
          </HyperLink>
        ),
      });
    }
  };

  const claimData = (claimMethod) => {
    if (claimMethod === "candy") {
      return (
        <React.Fragment>
          <TextField
            style={{width: "60ch"}}
            id="config-text-field"
            label="Candy Config"
            value={candyConfig}
            onChange={e => setCandyConfig(e.target.value)}
          />
          <TextField
            style={{width: "60ch"}}
            id="config-uuid-text-field"
            label="Candy UUID"
            value={candyUUID}
            onChange={e => setCandyUUID(e.target.value)}
          />
        </React.Fragment>
      );
    } else if (claimMethod === "transfer") {
      return null;
    } else if (claimMethod === "edition") {
      return (
        <React.Fragment>
          <TextField
            style={{width: "60ch"}}
            id="master-mint-text-field"
            label="Master Mint"
            value={masterMint}
            onChange={(e) => setMasterMint(e.target.value)}
          />
        </React.Fragment>
      );
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        style={{width: "60ch"}}
        id="base-text-field"
        label="Base Private Key"
        value={baseKey}
        onChange={(e) => setBaseKey(e.target.value)}
      />
      <FormControl fullWidth>
        <InputLabel id="claim-method-label">Claim Method</InputLabel>
        <Select
          labelId="claim-method-label"
          id="claim-method-select"
          value={claimMethod}
          label="Claim Method"
          onChange={(e) => {
            localStorage.setItem("claimMethod", e.target.value);
            setClaimMethod(e.target.value);
          }}
          style={{textAlign: "left"}}
        >
          <MenuItem value={"transfer"}>Token Transfer</MenuItem>
          <MenuItem value={"candy"}>Candy Machine</MenuItem>
          <MenuItem value={"edition"}>Limited Edition</MenuItem>
        </Select>
      </FormControl>
      {claimMethod !== "" && claimData(claimMethod)}
      <Button
        disabled={!wallet.connected || !baseKey}
        variant="contained"
        onClick={(e) => {
          const wrap = async () => {
            try {
              await submit(e);
            } catch (err) {
              notify({
                message: "Close failed",
                description: `${err}`,
              });
            }
          };
          wrap();
        }}
      >
        Close Gumdrop
      </Button>
    </Stack>
  );
};
