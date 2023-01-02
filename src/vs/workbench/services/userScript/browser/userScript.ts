/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'vs/base/common/event';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IEditorPane } from 'vs/workbench/common/editor';

export const IUserScriptService = createDecorator<IUserScriptService>('userScriptService');

export interface IUserScriptService {
	readonly _serviceBrand: undefined;

	reloadUserScript(): void;
	editUserScript(): Promise<IEditorPane | undefined>;

	onDidChange: Event<void>;
}
