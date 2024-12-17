//7d9sWPBHfB7twsJBe3KkVS6M3zwd4tMmN1QU8MsT9AhK
import * as borsh from 'borsh';
import * as web3 from "@solana/web3.js";
import * as BufferLayout from "@solana/buffer-layout";
import BN from "bn.js";
import { Buffer } from "buffer";

let greetedPubKey: web3.PublicKey;

// Define the structure of the account data
class GreetingAccount {
    counter = 0;
    constructor(fields: { counter: number } | undefined = undefined) {
        if (fields) {
            this.counter = fields.counter;
        }
    }
}

// Define the Borsh schema for serializing/deserializing GreetingAccount
const GreetingSchema = new Map([
    [GreetingAccount, { kind: 'struct', fields: [['counter', 'u32']] }]
]);

// Calculate the size of the serialized data
const GREETING_SIZE = borsh.serialize(
    GreetingSchema,
    new GreetingAccount(),
).length;

// Initialize connection to the Solana devnet
const connection = new web3.Connection(web3.clusterApiUrl("devnet"));

async function main() {
    const key: Uint8Array = Uint8Array.from([]);

    // Create a BufferLayout to encode instruction data
    const layout = BufferLayout.struct([BufferLayout.u32("counter")]);
    let data: Buffer = Buffer.alloc(layout.span);
    layout.encode({ counter: 7 }, data); // Encode the counter value into the buffer

    // Keypair of the signer for the transaction
    const signer: web3.Keypair = web3.Keypair.fromSecretKey(key);

    // Public key of the deployed program
    let programId: web3.PublicKey = new web3.PublicKey("7d9sWPBHfB7twsJBe3KkVS6M3zwd4tMmN1QU8MsT9AhK");

    const GREETING_SEED = 'hello 123';

    // Uncomment below to create the account with seed (only for first run)
    /*
    greetedPubKey = await web3.PublicKey.createWithSeed(
        signer.publicKey,
        GREETING_SEED,
        programId
    );
    */

    // Use an existing greeted account for subsequent runs
    greetedPubKey = new web3.PublicKey("G6mSQ67ozDVi2Cnokm4PhcaM3rodD7wMjXGk8V1EeGJB");

    // Get minimum balance needed for rent exemption
    const lamports = await connection.getMinimumBalanceForRentExemption(
        GREETING_SIZE,
    );

    // Create a new transaction
    let transaction = new web3.Transaction();

    // Uncomment to add the account creation instruction (only for first run)
    /*
    transaction.add(
        web3.SystemProgram.createAccountWithSeed({
            fromPubkey: signer.publicKey,
            basePubkey: signer.publicKey,
            seed: GREETING_SEED,
            newAccountPubkey: greetedPubKey,
            lamports,
            space: GREETING_SIZE,
            programId
        })
    );
    */

    // Add the instruction to invoke the program with input data
    transaction.add(
        new web3.TransactionInstruction({
            keys: [{
                pubkey: greetedPubKey, // Account to be modified
                isSigner: false,
                isWritable: true
            }],
            programId, // The deployed program's public key
            data: data // Encoded input data
        })
    );

    // Send and confirm the transaction
    await web3.sendAndConfirmTransaction(connection, transaction, [signer])
        .then((sig) => {
            console.log("Signature : ", sig);
        });

    // Fetch and display the updated greeting count
    reportGreetings();
}

main();

// Fetch the greeted account data and log the greeting counter
async function reportGreetings(): Promise<void> {
    const accountInfo = await connection.getAccountInfo(greetedPubKey);
    if (accountInfo === null) {
        throw 'Error: cannot find greeted account';
    }
    // Deserialize the account data to retrieve the counter
    const greeting = borsh.deserialize(
        GreetingSchema,
        GreetingAccount,
        accountInfo?.data ?? Buffer.alloc(0)
    );
    console.log(greetedPubKey.toBase58(), ' has been greeted with ', Number(greeting.counter), ' times');
}
