import { Component, OnInit, Input, EventEmitter, Output, SimpleChanges, OnChanges } from '@angular/core';
import { WorkflowConfig, WorkflowEngine } from '../workflow/workflow.processor';
import { UIModel } from '../models';

@Component({
    selector: 'ngx-dynamic-component', // tslint:disable-line
    template: `
    <dc-ui-selector
        [uiModel]='uiModel'
        [dataModel]='dataModel'
        [workflowEngine]='workflowEngine'
        (render)="render.emit($event)">
    </dc-ui-selector>
      `
})
export class NGXDynamicComponent implements OnInit, OnChanges {
    @Input() workflow: WorkflowConfig;
    @Input() dataModel: any;
    @Input() uiModel: UIModel<any>;
    @Input() appContext: any;
    @Output() render = new EventEmitter();

    workflowEngine: WorkflowEngine = null;

    async ngOnInit(): Promise<void> {
      this.resolveVariables();
      this.initWorkflow();
    }

    ngOnChanges({workflow}: SimpleChanges) {
      if (!workflow.firstChange && workflow.currentValue !== workflow.previousValue) {
        this.initWorkflow(workflow.currentValue);
      }
    }

    private initWorkflow(workflow = this.workflow) {
      this.workflow = workflow;
      this.workflow.vars = this.workflow.vars || {};
      this.workflow.vars.uiModel = this.uiModel;
      this.workflow.vars.dataModel = this.dataModel;
      this.workflowEngine = new WorkflowEngine(this.workflow);
      if (this.appContext && this.uiModel.id) {
        this.appContext[this.uiModel.id] = this.workflowEngine;
      }
    }

    private resolveVariables() {
      if (this.workflow.variableResolver) {
        this.uiModel = this.workflow.variableResolver.resolve(this.uiModel) as UIModel;
      }
    }
}
