/* eslint-disable fp/no-loops, fp/no-mutation, fp/no-mutating-methods, fp/no-let */

import { SolanaConnect } from "solana-connect";
import { Keypair, PublicKey } from "@solana/web3.js";
import "@fontsource/bowlby-one-sc";
import "@fontsource-variable/montserrat";
import "@fontsource/bangers";
import "@fontsource/ibm-plex-mono";
import { ElmApp } from "./ports";
import {map, Observable, switchMap} from "rxjs";
import {SignKeyPair} from "tweetnacl";
import * as tweetnacl from "tweetnacl";
import base58 from "bs58";
import {
  launch,
  buildMintIx,
  parsePow,
  findRegister,
  readRegister,
  RPC,
} from "./web3";

const { Elm } = require("./Main.elm");

let keygenWorkers: Worker[] | null = null;
const solConnect = new SolanaConnect();

(async () => {
  const app: ElmApp = Elm.Main.init({
    node: document.getElementById("app"),
    flags: {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      rpc: RPC.toString(),
    },
  });
  rxCreateXXX().subscribe(addr => {
     app.ports.addrCb.send(addr);
  });



  solConnect.onWalletChange((wallet) =>
    (async () => {
      if (wallet) {
        app.ports.walletCb.send(wallet.publicKey!.toString());
      } else {
        app.ports.disconnect.send(null);
      }
    })().catch((e) => {
      console.error(e);
    })
  );

  //app.ports.log.subscribe((txt: string) => console.log(txt));

  app.ports.checkId.subscribe((n) =>
    (async () => {
      const mint = await readRegister(n);
      app.ports.idExists.send(mint ? mint.toString() : null);
    })().catch((e) => {
      console.error(e);
    })
  );

  app.ports.openWalletMenu.subscribe(() => {
    solConnect.openMenu();
  });

  app.ports.mintNft.subscribe((bytes) =>
    (async () => {
      const mintKeypair = Keypair.fromSecretKey(new Uint8Array(bytes));
      const wallet = solConnect.getWallet();

      if (!wallet || !wallet.publicKey) {
        return;
      }

      const pow = parsePow(mintKeypair.publicKey);
      if (!pow.id) {
        throw Error("Id not parsed");
      }

      const ixns = [
        buildMintIx(wallet.publicKey, mintKeypair.publicKey, pow.id),
      ];
      const sig = await launch(wallet, ixns, [mintKeypair]);
      app.ports.mintCb.send(sig);
    })().catch((e) => {
      console.error(e);
      app.ports.mintErr.send(null);
    })
  );

  app.ports.fileOut.subscribe((file: File) =>
    (async () => {
      const content = new TextDecoder().decode(await file.arrayBuffer());
      const bytes = JSON.parse(content);

      const kp = Keypair.fromSecretKey(new Uint8Array(bytes));
      const nft = parsePow(kp.publicKey);
      const pubStr = kp.publicKey.toString();

      if (!nft.id) {
        return app.ports.loadKeypairCb.send({
          nft: null,
          pubkey: pubStr,
          bytes,
          parts: nft.parts,
        });
      }

      const register = findRegister(nft.id);

      return app.ports.loadKeypairCb.send({
        nft: { id: nft.id, register: register.toString() },
        pubkey: pubStr,
        parts: nft.parts,
        bytes,
      });
    })().catch((e) => {
      app.ports.loadKeypairCb.send(null);
      console.error(e);
    })
  );

  app.ports.stopGrind.subscribe(() => {
    if (keygenWorkers) {
      keygenWorkers.forEach((w) => w.terminate());
      keygenWorkers = null;
    }
  });

  app.ports.startGrind.subscribe((obj) =>
    (async () => {
      if (!keygenWorkers) {
        const threads = navigator.hardwareConcurrency
          ? navigator.hardwareConcurrency / 2
          : 4;
        const ws = Array.from({ length: threads }, () => {
          const worker = new Worker("/rxworker.js", { type: "module" });
          worker.onmessage = async (e) => {
            if (e.data.exit) {
              app.ports.countCb.send(e.data.exit);

              // Restart the generation
              worker.postMessage(obj);
            }
            if (e.data.match) {
              const bytes = e.data.match;
              const pubkey = new PublicKey(bytes.slice(32));
              if (obj.criteria) {
                app.ports.grindCb.send({
                  pubkey: pubkey.toString(),
                  bytes: Array.from(e.data.match),
                  nft: null,
                  parts: [pubkey.toString()],
                });
              } else {
                const kp = e.data.match;

                const data = parsePow(pubkey);
                if (!data.id) {
                  throw Error("no bueno");
                }
                const register = findRegister(data.id);
                app.ports.grindCb.send({
                  pubkey: pubkey.toString(),
                  bytes: Array.from(kp),
                  nft: { id: data.id, register: register.toString() },
                  parts: data.parts,
                });
              }
            }
          };
          worker.onerror = (e) => {
            console.error(e);
          };
          return worker;
        });
        keygenWorkers = ws;
      }
      app.ports.startTimeCb.send(Date.now());
      keygenWorkers.forEach((worker) => worker.postMessage(obj));
    })().catch((e) => {
      console.error(e);
    })
  );
})().catch((e) => {
  console.error(e);
});

function rxCreateXXX(): Observable<[string, string, string]> {
    return generateEd25519KeyPair$
        .pipe(
            map((keypair) => base58.encode(keypair.publicKey)),
            map(inputString => {

                const midStart = Math.floor(Math.random() * (35 - 3 + 1)) + 3;

                const midEnd = midStart + (Math.floor(Math.random() * 3) + 2);

                return [
                    inputString.substring(0, midStart),
                    "X".repeat(midEnd - midStart),
                    inputString.substring(midEnd)]
            })
        );
}

async function createXXX(): Promise<[string, string, string]> {
  const inputString = Keypair.generate().publicKey.toString();

  const midStart = Math.floor(Math.random() * (35 - 3 + 1)) + 3;

  const midEnd = midStart + (Math.floor(Math.random() * 3) + 2);

  const start = inputString.substring(0, midStart);
  const middle = "X".repeat(midEnd - midStart);
  const end = inputString.substring(midEnd);

  return [start, middle, end];
}

function rxParseKeypair(solanaKeypair: Uint8Array): SignKeyPair {
    return tweetnacl.sign.keyPair.fromSecretKey(solanaKeypair);
}

const generateEd25519KeyPair$ : Observable<SignKeyPair>= new Observable<SignKeyPair>((subscriber) => {
    const keyPair: tweetnacl.SignKeyPair = tweetnacl.sign.keyPair();
    subscriber.next(keyPair);
    subscriber.complete();
});
