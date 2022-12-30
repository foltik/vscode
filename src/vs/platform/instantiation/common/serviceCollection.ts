/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ServiceIdentifier } from 'vs/platform/instantiation/common/instantiation';
import { SyncDescriptor } from './descriptors';

export class ServiceCollection {

	private _entries = new Map<ServiceIdentifier<any>, any>();

	constructor(...entries: [ServiceIdentifier<any>, any][]) {
		for (const [id, service] of entries) {
			this.set(id, service);
		}
	}

	set<T>(id: ServiceIdentifier<T>, instanceOrDescriptor: T | SyncDescriptor<T>): T | SyncDescriptor<T> {
		const result = this._entries.get(id);
		this._entries.set(id, instanceOrDescriptor);
		return result;
	}

	has(id: ServiceIdentifier<any>): boolean {
		return this._entries.has(id);
	}

	get<T>(id: ServiceIdentifier<T>): T | SyncDescriptor<T> {
		return this._entries.get(id);
	}

	getIdentifier<T>(id: ServiceIdentifier<T> | string): ServiceIdentifier<T> | undefined {
		function isServiceIdentifier<T>(id: any): id is ServiceIdentifier<T> {
			return id instanceof Function;
		}

		if (isServiceIdentifier(id)) {
			return id;
		} else {
			return [...this._entries.keys()].find(k => k.toString() === id);
		}
	}
}
