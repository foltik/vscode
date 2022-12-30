/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createHash } from 'crypto';

import { IMessage, ISignService } from 'vs/platform/sign/common/sign';

export class SignService implements ISignService {
	declare readonly _serviceBrand: undefined;

	async createNewMessage(value: string): Promise<IMessage> {
		return { id: '', data: value };
	}

	async validate(message: IMessage, value: string): Promise<boolean> {
		return true;
	}

	async sign(value: string): Promise<string> {
		const license = 'You may only use the C/C++ Extension for Visual Studio Code and C# Extension for Visual Studio Code';
		const salt = 'V+y,(H`v&A\\@x+;4GuK<$z]..?8#wVZn\'*+}j1E\\$k0$/lvkpb846K:kf"CI\\Yl*d4 / .R,{ ';

		const payload = value + license + license + salt;

		const hash = createHash('sha256').update(payload).digest();
		const base64 = hash.toString('base64');

		return '000' + base64;
	}
}
