import { dummyMailData, dummyMailDataResolvedAddresses } from '../test.const';
import { createMimeMessage } from './generate';
import { simpleMimeHeaderParser } from './simpleMimeHeaderParser';

test('should split message into headers', async () => {
	const mimeMessage = await createMimeMessage(dummyMailData, dummyMailDataResolvedAddresses);

	const result = simpleMimeHeaderParser(mimeMessage.original);

	expect(result.get('Content-Type')).toBeDefined();
	result.delete('Content-Type'); // it has the random boundary
	expect(result).toMatchInlineSnapshot(`
		Map {
		  "MIME-Version" => "1.0",
		  "Date" => "Tue, 14 Jun 2022 00:00:00 +0000",
		  "Message-ID" => "<mail-data-id@mailchain.test>",
		  "Subject" => "=?UTF-8?B?8J+SjCBEdW1teSBNYWlsRGF0YSBzdWJqZWN0IPCfmIk=?=",
		  "From" => ""alice@mailchain" <alice@mailchain.test>",
		  "To" => ""bob@mailchain" <bob@mailchain.test>, "0xd5ab...7fe6@ethereum" <0xd5ab4ce3605cd590db609b6b5c8901fdb2ef7fe6@ethereum.mailchain.test>, "tim.eth" <tim@eth.mailchain.test>, "Solana Squad" <8z5rf3d7ExDYE7WjuxBKjPrKH5sbiEzAhEJCw6TkvSUJ@squad.mailchain.test>",
		  "Cc" => ""0x92d8...1efb@ethereum" <0x92d8f10248c6a3953cc3692a894655ad05d61efb@ethereum.mailchain.test>, "john" <john@mailchain.test>",
		  "Bcc" => ""jane" <jane@mailchain.test>, "maria" <maria@mailchain.test>",
		  "X-IdentityKeys" => "v="1"; alice@mailchain.test="0xe237a5d03f0fb08681a9bfb5e30dcee7a744e5a57acc43d7be979b00a6c6b24d1b:mailchain"; bob@mailchain.test="0xe2bc41b25646850c31e0c87ebeebc859e02387149b510e3b6087a2e98737d0703f:mailchain"; 0xd5ab4ce3605cd590db609b6b5c8901fdb2ef7fe6@ethereum.mailchain.test="0xe10269d908510e355beb1d5bf2df8129e5b6401e1969891e8016a0b2300739bbb006:ethereum"; tim@eth.mailchain.test="0xe2ab3caa23a5b511af5ad7b7ef6076e471ab7e75a9dc910ea60e417a2b770a5671:ethereum"; 8gw8X5R9c8BvmAR83Z72GANcmkfskXATP3DeyxZkk2U8@solana.mailchain.com="0xe2723caa23a5b511af5ad7b7ef6076e414ab7e75a9dc910ea60e417a2b770a5671:solana"; 47L935B9UmtJ9oeF8Xy7AE1qGnxEPnk42eMtwoeVnsx3@solana.mailchain.com="0xe22e322f8740c60172111ac8eadcdda2512f90d06d0e503ef189979a159bece1e8:solana"; 0x92d8f10248c6a3953cc3692a894655ad05d61efb@ethereum.mailchain.test="0xe103bdf6fb97c97c126b492186a4d5b28f34f0671a5aacc974da3bde0be93e45a1c5:ethereum"; john@mailchain.test="0xe2727eaa23a5b511af5ad7b7ef6076e414ab7e75a9dc910ea60e417a2b770a5671:mailchain"; jane@mailchain.test="0xe2723c7523a5b511af5ad7b7ef6076e414ab7e75a9dc910ea60e417a2b770a5671:mailchain"; maria@mailchain.test="0xe2723c7523a59111af5ad7b7ef6076e414ab7e75a9dc910ea60e417a2b770a5671:mailchain"",
		}
	`);
});
