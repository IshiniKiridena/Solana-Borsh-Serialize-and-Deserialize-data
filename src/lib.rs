use borsh::{BorshDeserialize, BorshSerialize}; 
// Import Borsh serialization/deserialization traits for efficient binary data encoding/decoding.

use solana_program::{
    account_info::{next_account_info, AccountInfo}, // Access account metadata and iterate over accounts.
    entrypoint, // Define the program entry point.
    entrypoint::ProgramResult, // Type alias for Result<(), ProgramError>.
    msg, // Macro for logging messages to the Solana runtime for debugging.
    program_error::ProgramError, // Represents errors returned by Solana programs.
    pubkey::Pubkey, // Provides tools to handle public keys in Solana.
};

/// Define the structure of the account data stored on-chain.
/// This structure uses Borsh for efficient serialization/deserialization.
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    pub counter: u32, // A counter to track the number of greetings.
}

// Define the entry point for the Solana program.
// The runtime invokes this function when the program is called.
entrypoint!(process_instruction);

/// Main processing function for the Solana program.
///
/// Parameters:
/// - `program_id`: The public key of the program itself.
/// - `accounts`: A slice containing all the account information required for the instruction.
/// - `_instruction_data`: Serialized input data for the instruction (e.g., arguments).
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    // Get the first account from the accounts slice.
    // `next_account_info` safely advances the iterator and retrieves the next account.
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    // Uncommenting the following line would retrieve a second account if needed.
    // let account2 = next_account_info(accounts_iter)?;

    msg!("Start the decode..");

    // Deserialize the `_instruction_data` into a `GreetingAccount` struct.
    // - `try_from_slice`: Attempts to decode the data slice.
    // - If decoding fails, log the error and return `ProgramError::InvalidInstructionData`.
    let data_received = GreetingAccount::try_from_slice(_instruction_data).map_err(|err| {
        msg!("Error, {:?}", err); // Log the error.
        ProgramError::InvalidInstructionData // Return an invalid data error.
    })?;

    // Log the deserialized data to the Solana runtime.
    msg!("Greeting passed is : {:?}", data_received);

    // Check if the account's owner matches the program ID.
    // This ensures that only accounts owned by this program can be modified.
    if account.owner != program_id {
        msg!("Wrong permissions");
        return Err(ProgramError::IncorrectProgramId); // Return a permissions error.
    }

    // Deserialize the existing data in the account into a `GreetingAccount`.
    // `account.data.borrow()` provides a reference to the account's data.
    let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;

    // Increment the `counter` in the account's data by the `counter` from `data_received`.
    greeting_account.counter += data_received.counter;

    // Serialize the updated `GreetingAccount` struct back into the account's data.
    // `account.data.borrow_mut()` provides mutable access to the account's data.
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;

    // Log the updated counter value.
    msg!("Greeted : {}, times", greeting_account.counter);

    // Return `Ok(())` to indicate successful execution.
    Ok(())
}
