/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vs/nls';
import { Action2, registerAction2 } from 'vs/platform/actions/common/actions';
import { Categories } from 'vs/platform/action/common/actionCommonCategories';
import { Registry } from 'vs/platform/registry/common/platform';
import { Extensions as WorkbenchExtensions, IWorkbenchContribution, IWorkbenchContributionsRegistry } from 'vs/workbench/common/contributions';
import { Disposable } from 'vs/base/common/lifecycle';
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle';
import { IUserScriptService } from 'vs/workbench/services/userScript/browser/userScript';
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';


class UserScriptContributions extends Disposable implements IWorkbenchContribution {
	constructor(
		@IUserScriptService private readonly userScriptSvc: IUserScriptService,
	) {
		super();

		this.userScriptSvc.reloadUserScript();
		this.userScriptSvc.onDidChange(() => this.userScriptSvc.reloadUserScript());

		this.registerActions();
		// this.registerKeybindings();
	}

	private registerActions() {
		registerAction2(class extends Action2 {
			constructor() {
				super({
					id: 'workbench.action.editUserScript',
					title: { value: nls.localize('editUserScript', "Edit User Script"), original: 'Edit User Script' },
					category: Categories.Preferences,
					f1: true
				});
			}

			run(accessor: ServicesAccessor): void {
				accessor.get(IUserScriptService).editUserScript();
			}
		});

	}
}

const workbenchContributionsRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchContributionsRegistry.registerWorkbenchContribution(UserScriptContributions, LifecyclePhase.Restored);
