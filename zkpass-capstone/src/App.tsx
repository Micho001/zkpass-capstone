import { type FormEvent, useState } from "react";
import "./App.css";
import TransgateConnect from "@zkpass/transgate-js-sdk";
import type { Result } from "@zkpass/transgate-js-sdk/lib/types";
import { ethers } from "ethers";

export type TransgateError = {
	message: string;
	code: number;
};

const App = () => {
	const [appId, setAppId] = useState<string>("c0527327-0419-4ca2-bd5c-ecce2f2f5c07");
	const [schemaId, setSchemaId] = useState<string>("3864fca50a304160ace63333cfe47891");
	const [result, setResult] = useState<Result | undefined>(undefined);

	const requestVerifyMessage = async (
		e: FormEvent,
		appId: string,
		schemaId: string
	) => {
		e.preventDefault();
		try {
			const connector = new TransgateConnect(appId);
			const isAvailable = await connector.isTransgateAvailable();

			if (!isAvailable) {
				alert(
					"Please install zkPass Transgate from https://chromewebstore.google.com/detail/zkpass-transgate/afkoofjocpbclhnldmmaphappihehpma"
				);
				return; // Stop further execution
			}

			const provider = window.ethereum
				? new ethers.BrowserProvider(window.ethereum)
				: null;

			if (!provider) {
				alert("Ethereum provider not found. Please install MetaMask.");
				return;
			}

			const signer = await provider.getSigner();
			const recipient = await signer.getAddress();
			const res = (await connector.launch(schemaId, recipient)) as Result;

			console.log("Result", res);

			const verifiedResult = connector.verifyProofMessageSignature(
				"evm",
				schemaId,
				res
			);

			if (verifiedResult) {
				alert("Verification Successful");
				setResult(res);
			} else {
				alert("Verification Failed");
			}
		} catch (error) {
			const transgateError = error as TransgateError;
			alert(`Transgate Error: ${transgateError.message}`);
			console.error(transgateError);
		}
	};

	return (
		<div className="app">
			<form
				className="form"
				onSubmit={(e) => requestVerifyMessage(e, appId, schemaId)}
			>
				<label htmlFor="app-id">
					AppId:
					<input
						id="app-id"
						type="text"
						placeholder="Your App ID"
						value={appId}
						onChange={(e) => setAppId(e.target.value)}
					/>
				</label>
				<label htmlFor="schema-id">
					SchemaId:
					<input
						id="schema-id"
						type="text"
						placeholder="Your Schema ID"
						value={schemaId}
						onChange={(e) => setSchemaId(e.target.value)}
					/>
				</label>
				<button type="submit">Start Verification</button>
				{result !== undefined ? (
					<pre>Result: {JSON.stringify(result, null, 2)}</pre>
				) : (
					""
				)}
			</form>
		</div>
	);
};

export default App;
