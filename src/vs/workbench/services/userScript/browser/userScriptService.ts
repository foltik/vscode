/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vs/nls';
import { RunOnceScheduler } from 'vs/base/common/async';
import { Emitter, Event } from 'vs/base/common/event';
import { Disposable, IDisposable } from 'vs/base/common/lifecycle';
import { extUri } from 'vs/base/common/resources';
import { URI } from 'vs/base/common/uri';
import { FileOperation, FileOperationError, FileOperationResult, IFileService } from 'vs/platform/files/common/files';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { INotificationService, Severity } from 'vs/platform/notification/common/notification';
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile';
import { IUserScriptService } from 'vs/workbench/services/userScript/browser/userScript';
import { getErrorMessage } from 'vs/base/common/errors';
import { IEditorPane } from 'vs/workbench/common/editor';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles';
import { ILabelService } from 'vs/platform/label/common/label';
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions';

import { Context } from 'vs/workbench/services/userScript/browser/context';
import { Registry } from 'vs/platform/registry/common/platform';

export class UserScriptService extends Disposable implements IUserScriptService, IDisposable {
	declare readonly _serviceBrand: undefined;

	private readonly policy = window.trustedTypes?.createPolicy('userScript', { createScript: source => source });

	private readonly userScriptResource: URI;
	private context: Context | undefined = undefined;

	private readonly scheduler: RunOnceScheduler;
	protected readonly _onDidChange: Emitter<void> = this._register(new Emitter<void>());
	readonly onDidChange: Event<void> = this._onDidChange.event;

	constructor(
		@IInstantiationService private readonly instaSvc: IInstantiationService,
		@IUserDataProfileService profileSvc: IUserDataProfileService,
		@IFileService private readonly fileSvc: IFileService,
		@IEditorService private readonly editorSvc: IEditorService,
		@ITextFileService private readonly textFileSvc: ITextFileService,
		@INotificationService private readonly notifSvc: INotificationService,
		@ILabelService private readonly labelSvc: ILabelService,
	) {
		super();

		this.userScriptResource = profileSvc.currentProfile.userScriptResource;

		this.scheduler = this._register(new RunOnceScheduler(() => this.reloadUserScript(), 50));

		// Watch the script directory(and the script itself in case it's a symlink)
		this._register(this.fileSvc.watch(extUri.dirname(this.userScriptResource)));
		this._register(this.fileSvc.watch(this.userScriptResource));
		this._register(Event.any(
			Event.filter(this.fileSvc.onDidFilesChange,
				e => e.contains(this.userScriptResource)),
			Event.filter(this.fileSvc.onDidRunOperation,
				e => extUri.isEqual(e.resource, this.userScriptResource)
					&& (e.isOperation(FileOperation.CREATE)
						|| e.isOperation(FileOperation.COPY)
						|| e.isOperation(FileOperation.DELETE)
						|| e.isOperation(FileOperation.WRITE)))
		)(() => this.scheduler.schedule()));
	}

	async reloadUserScript(): Promise<void> {
		const js = (await this.fileSvc.readFile(this.userScriptResource)).value.toString();
		const source = `(async function($) {\n ${js} \n})`;
		const script = this.policy ? this.policy.createScript(source) : source;

		if (this.context) {
			this.context.dispose();
		}
		this.context = new Context(this.instaSvc, Registry);

		try {
			// eslint-disable-next-line no-eval
			const fn = eval(script as any);
			await fn(this.context);
		} catch (e) {
			const message = nls.localize('fail.evalUserScript', "Error running user script: {0}", getErrorMessage(e));
			this.notifSvc.notify({
				message,
				severity: Severity.Error,
			});
		}
	}

	async editUserScript(): Promise<IEditorPane | undefined> {
		await this.createIfNotExists(this.userScriptResource, 'blah');
		return this.editorSvc.openEditor({ resource: this.userScriptResource });
	}

	private async createIfNotExists(resource: URI, contents: string): Promise<void> {
		try {
			await this.textFileSvc.read(resource, { acceptTextOnly: true });
		} catch (error) {
			if ((<FileOperationError>error).fileOperationResult === FileOperationResult.FILE_NOT_FOUND) {
				try {
					await this.textFileSvc.write(resource, contents);
					return;
				} catch (error2) {
					throw new Error(nls.localize('fail.createSettings', "Unable to create '{0}' ({1}).", this.labelSvc.getUriLabel(resource, { relative: true }), getErrorMessage(error2)));
				}
			} else {
				throw error;
			}
		}
	}
}

registerSingleton(IUserScriptService, UserScriptService, InstantiationType.Delayed);
