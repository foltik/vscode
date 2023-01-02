/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRegistry } from 'vs/platform/registry/common/platform';
import { Disposable, IDisposable } from 'vs/base/common/lifecycle';
import { IInstantiationService, ServiceIdentifier } from 'vs/platform/instantiation/common/instantiation';

export class Context extends Disposable {
	constructor(
		readonly services: IInstantiationService,
		readonly registries: IRegistry,
	) {
		super();
	}

	register(o: IDisposable) {
		this._register(o);
	}

	service<T>(id: ServiceIdentifier<T> | string): T {
		return this.services.invokeFunction(accessor => accessor.get(id));
	}
	registry<T>(id: string): T {
		return this.registries.as(id);
	}
}
