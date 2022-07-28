export type MailAddress = {
	name: string;
	address: string;
};

export type MailData = {
	id: string;
	subject: string;
	from: MailAddress;
	recipients: MailAddress[];
	carbonCopyRecipients: MailAddress[];
	blindCarbonCopyRecipients: MailAddress[];
	message: string;
	plainTextMessage: string;
};
