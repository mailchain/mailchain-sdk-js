import { parseMimeText } from './parse';
import { emailWithImage } from './mocks/test-data/emailWithImage';

const TO_NAME = 'tESTS';
const TO_EMAIL = 'text@email.com';
const FROM_EMAIL = 'from@email.com';
const FROM_NAME = 'from_name';
const SUBJECT = 'test subject';

const RAW_TEXT = `Good afternoon everyone

As you will know, this is the test.


${FROM_NAME}`;

const HTML_TEXT = `<div dir=3D"ltr">Good afternoon everyone<div><br></div><div>As you will kno=
w, this is the test=C2=A0</div><=
div><br></div>${FROM_NAME}</div>`;

const testMime = `Delivered-To: ${TO_EMAIL}
Received: by 2002:a05:7301:92:b0:60:ab2e:6c75 with SMTP id gi18csp509518dyb;
        Wed, 18 May 2022 04:48:00 -0700 (PDT)
X-Received: by 2002:a2e:a495:0:b0:253:c86e:328c with SMTP id h21-20020a2ea495000000b00253c86e328cmr2011371lji.175.1652874480776;
        Wed, 18 May 2022 04:48:00 -0700 (PDT)
ARC-Seal: i=1; a=rsa-sha256; t=1652874480; cv=none;
        d=google.com; s=arc-20160816;
        b=Df1Or21GnHSiruj1QWdVpjokxWD0gr1hLGWTcsOkfUu9UwPW2M8kZ3ymT7SOXxwA90
         wYpJtXx3Ckl5Egf0qE6oPxRg1V/P+EzTBiDa+ZDWAu8demZjAGVyFaxECb1OHR5xjr5J
         +7jVzJu0fw/tzEq3bpUyv/7zj/7kU1Xn9aQv9g/JYYWiV+DvgFBk4216GiZDFBUWHleE
         Bn3MKr7m+n58CvI7bAHT+qUNi3v71da8dzl0B8kwITMHMonY4vRhT4zxqp/NQ36oYVae
         Xm5FbA4dtAaEBBVmhuL4NX+xS7XGJTvPqdn3W9ynf8Kp/hIVwlNHCy+P7d1bxZjueq3e
         lDTA==
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816;
        h=to:subject:message-id:date:from:mime-version:dkim-signature;
        bh=AzNIctzCW8a4DsQgv6OcrWc1QsJtJhL6zTOZpdwH2fw=;
        b=HyKQ7opIdaOzjDlmYEVM1OrGSxQjrI82pi77Wi862bbBSpyuUC8Mt8KmGwPnbt5f+5
         dob4skRULGX28fJHd70+KnM7xv5PO6NfJPWKL+0GgvCkwPkhQVXme+buZII2dKn3Mve+
         lunz6ACd/98BMhWe5UZeIpknnA7ekH1n5PaFub6frHM4WRzPCv9O/F1y9nXnNE67yU+C
         pK+6MI7IOUk/JCO2sA5Fo2vK6A+iuOTW2JnRNpiIXzPRqn0AhenIPXClfxFy21CM4Cc2
         mmOaajw06t1Sy93R9ZefQyFq+fZt+RuHDGQqhQd9yp6WtrcjUKoP+GQGx5MWFpNn1wZ1
         xOkg==
ARC-Authentication-Results: i=1; mx.google.com;
       dkim=pass header.i=@bist-ge.20210112.gappssmtp.com header.s=20210112 header.b=kaoeEcjY;
       spf=pass (google.com: domain of ${FROM_EMAIL} designates 209.85.220.41 as permitted sender) smtp.mailfrom=${FROM_EMAIL}
Return-Path: <${FROM_EMAIL}>
Received: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])
        by mx.google.com with SMTPS id h10-20020ac24d2a000000b00473a307b213sor472383lfk.89.2022.05.18.04.48.00
        for <${TO_EMAIL}>
        (Google Transport Security);
        Wed, 18 May 2022 04:48:00 -0700 (PDT)
Received-SPF: pass (google.com: domain of ${FROM_EMAIL} designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;
Authentication-Results: mx.google.com;
       dkim=pass header.i=@bist-ge.20210112.gappssmtp.com header.s=20210112 header.b=kaoeEcjY;
       spf=pass (google.com: domain of ${FROM_EMAIL} designates 209.85.220.41 as permitted sender) smtp.mailfrom=${FROM_EMAIL}
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=bist-ge.20210112.gappssmtp.com; s=20210112;
        h=mime-version:from:date:message-id:subject:to;
        bh=AzNIctzCW8a4DsQgv6OcrWc1QsJtJhL6zTOZpdwH2fw=;
        b=kaoeEcjYaoSCnpqpGUDiN0kWNqCtwdjTe+0NAQFfnFdWkTKHUaxjhnHXMrF+7Hcd3r
         nW3lFzBHY7Xjq3PwZBNDQqyr1Y+x0yY498o1dy64rHPWgrDcWfQSQ2dCCYVpTs/6keIg
         CbemJinHq4/Fler4cpsVsI2epiXsfEKc9jxF0wHwdJgt+MSjcEVyZO9OfyHMlxSe6Gcy
         P8JWYxlwXbP3aLgXHIVhvkzJhjmYCvNI4k1i4PqW5aW6w9B9uydqGrErNrhMhlb7ZGe6
         dvAr8a01SrJKY82uOKf6fEW9umanZMFJ1RUJHDskrqrlELsqfRiTtTQn5ZNb60OOWj9G
         HTiA==
X-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=1e100.net; s=20210112;
        h=x-gm-message-state:mime-version:from:date:message-id:subject:to;
        bh=AzNIctzCW8a4DsQgv6OcrWc1QsJtJhL6zTOZpdwH2fw=;
        b=OZPP6HOik43EKm5YgTr1NoOEVREF4JaMHyRsNyOBqifij8NH8Jsn4GwmJ9cP+5hpBl
         FKQQiYUfkZuXwo9Boln5LZTQYAoUM/nqiyMOyEPaxsljFM9MNcrXBX4B1Xh2gH4coHkN
         2b5inQTFq+BS4I2pDfgRYEAL19KUkQB18io9SVWE1HeVqBGZCZXFHb3ren8wXYFoVJCA
         vuSaI8aFQEXd7kuUzkhs7l/o5lye+sHPMLtRvkrF8OZlda7Q+xAfcoZ2KXCpLQzzHFUO
         oEkuTHfCYNvUHio3oWaQFQ599M7orX46BdVtXmCFh8Q5ce/Y6s4GBJH/H7/lTDNr2HP1
         fMNA==
X-Gm-Message-State: AOAM530giLtdhuF7gcK2wI/74Lsi3cSOjXpMC1raGFmKggdM5BCtxd7k EnHWpFGoXf3arT7aktd/pMDY8cSTnFYEUgnfA19l/A==
X-Google-Smtp-Source: ABdhPJxla8zSxs4uBdCKnljVN+67bTKfG5A3HcauFOe+Knxf0fbGXQJzyrjAsoCtQi6L/UoTOGdOrvLN79JK4zeBUoo=
X-Received: by 2002:a19:6553:0:b0:477:bf5e:7f2b with SMTP id c19-20020a196553000000b00477bf5e7f2bmr503955lfj.468.1652874480376; Wed, 18 May 2022 04:48:00 -0700 (PDT)
MIME-Version: 1.0
From: ${FROM_NAME} <${FROM_EMAIL}>
Date: Wed, 18 May 2022 15:47:49 +0400
Message-ID: <CADW5KMzntJ_tAY18bkLakwCgJea7tc=Fu_DF5+cR0-k66sF3VQ@mail.gmail.com>
Subject: ${SUBJECT}
To: ${TO_NAME} <${TO_EMAIL}>
Content-Type: multipart/alternative; boundary="00000000000042fb8505df47d4a0"
Bcc: ${TO_EMAIL}

--00000000000042fb8505df47d4a0
Content-Type: text/plain; charset="UTF-8"

${RAW_TEXT}
--00000000000042fb8505df47d4a0
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: quoted-printable

${HTML_TEXT}
--00000000000042fb8505df47d4a0--`;

describe('mime text parser)', () => {
	afterAll(() => jest.resetAllMocks());
	const mimeDetails = parseMimeText(testMime);
	it('verify details', async () => {
		expect(mimeDetails.from).toEqual([
			{
				address: FROM_EMAIL,
				name: FROM_NAME,
			},
		]);
		expect(mimeDetails.to).toEqual([
			{
				address: TO_EMAIL,
				name: TO_NAME,
			},
		]);
		expect(mimeDetails.subject).toEqual(SUBJECT);
		expect(mimeDetails.childNodes).toEqual([
			{
				header: ['Content-Type: text/plain; charset="UTF-8"'],
				raw: `

${RAW_TEXT}`,
			},
			{
				header: ['Content-Type: text/html; charset="UTF-8"', 'Content-Transfer-Encoding: quoted-printable'],
				raw: `


${HTML_TEXT}`,
			},
		]);
	});

	it('verify image email', async () => {
		const verifyMimeDetails = parseMimeText(emailWithImage);
		expect(verifyMimeDetails.childNodes[0].header[0]).toContain('Content-Type: multipart/alternative;');
		expect(verifyMimeDetails.childNodes[1].header[0]).toContain('Content-Type: image/png;');
	});
});

export {};
