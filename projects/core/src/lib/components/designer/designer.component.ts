import { Component, OnInit, Input, ElementRef, AfterViewInit, ViewChild,
  Output, EventEmitter, OnDestroy } from '@angular/core';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, filter, map } from 'rxjs/operators';
import { Ace, edit } from 'ace-builds';
import { Interpreter } from 'jspython-interpreter';
import { UIModel, DesignerVisibility } from '../../models';
import { DragDropService } from '../../services/drag-drop.service';
import { ControlsPanelComponent } from '../controls-panel/controls-panel.component';
import { formatObjToJsonStr } from '../../utils';

@Component({
  selector: 'ngx-designer-component', // tslint:disable-line
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.scss']
})
export class DesignerComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() uiModel: UIModel;
  @Input() scripts: string;
  @Input() interpreter: Interpreter;
  @Input() visibility: DesignerVisibility;
  @Output() uiModelUpdated = new EventEmitter<UIModel>();
  @Output() scriptUpdate = new EventEmitter<string>();
  @ViewChild('tabset') tabset: TabsetComponent;
  @ViewChild('controlsPanel') controlsPanel: ControlsPanelComponent;
  @ViewChild('uiModelEl') uiModelEl: ElementRef;
  @ViewChild('script') scriptEl: ElementRef;

  /** Selected component UI Model */
  uiModelToEdit: UIModel;
  /** Designer UI Model */
  uiModelVal: UIModel;
  uiModelEditor: Ace.Editor;
  scriptEditor: Ace.Editor;
  DesignerVisibility = DesignerVisibility;
  error: string;
  formatted = true;
  modeState = {
    script: false,
    designer: true
  };
  scriptConfigSize = 0;
  showScripts: boolean;
  showUIModel: boolean;
  visibilityMode = DesignerVisibility.All;

  private destroy = new Subject();

  get fullMode() {
    return this.scriptConfigSize === 0 || this.scriptConfigSize === 100;
  }

  constructor(
    private container: ElementRef,
    private dragDropService: DragDropService) { }

  ngOnInit() {
    if (this.visibility) {
      this.visibilityMode = this.visibility;
    }
    this.showScripts = [DesignerVisibility.All, DesignerVisibility.Scripts].includes(this.visibilityMode);
    this.showUIModel = [DesignerVisibility.All, DesignerVisibility.UIModel].includes(this.visibilityMode);
    this.uiModelVal = this.uiModel;
    this.dragDropService.uiModelUpdates$.pipe(takeUntil(this.destroy)).subscribe(uiModel => {
      this.updateUIModel(uiModel);
    });

    this.dragDropService.selectedComponent$.pipe(takeUntil(this.destroy)).subscribe(({uiModel}) => {
      this.uiModelToEdit = uiModel;
      this.tabSelect(1);
    });

    this.dragDropService.componentRemoved$.pipe(takeUntil(this.destroy)).subscribe(() => {
      this.tabSelect(0);
    });
  }

  ngAfterViewInit() {
    if (this.showUIModel) {
      this.uiModelEditor = edit(this.uiModelEl.nativeElement, {
        mode: 'ace/mode/json',
        autoScrollEditorIntoView: true,
        value: formatObjToJsonStr(this.uiModelVal)
      });

      fromEvent(this.uiModelEditor, 'change').pipe(
        debounceTime(500),
        map(() => {
          return this.getUIModelObject();
        }),
        filter(v => Boolean(v))).subscribe(async uiModel => {
          this.uiModelVal = uiModel;
          await this.initDrag();
          if (this.uiModelToEdit) {
            const el = await this.dragDropService.selectCurrentComponent();
            el.click();
          }
          this.uiModelUpdated.emit(uiModel);
        });
    }

    if (this.showScripts) {
      this.scriptEditor = edit(this.scriptEl.nativeElement, {
        mode: 'ace/mode/python',
        autoScrollEditorIntoView: true,
        value: this.scripts,
        tabSize: 2,
        useSoftTabs: true,
        indentedSoftWrap: true,
      });

      this.scriptEditor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: false,
        enableLiveAutocompletion: true
      });

      fromEvent(this.scriptEditor, 'change').pipe(debounceTime(500)).subscribe(() => {
        this.scriptUpdate.emit(this.scriptEditor.getValue());
      });
    }

    this.initDrag();
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  onSizeChange() {
    if (this.showUIModel) {
      this.uiModelEditor.resize();
    }
    if (this.showScripts) {
      this.scriptEditor.resize();
    }
  }

  onModeState(prop: string) {
    this.modeState[prop] = !this.modeState[prop];
    if (this.modeState.script && !this.modeState.designer) {
      this.scriptConfigSize = 100;
    } else if (this.modeState.script && this.modeState.designer) {
      this.scriptConfigSize = 50;
    } else {
      this.scriptConfigSize = 0;
    }
  }

  private getUIModelObject() {
    try {
      return JSON.parse(this.uiModelEditor.getValue());
    } catch (e) {
      return false;
    }
  }

  private initDrag() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.dragDropService.init(this.container, this.uiModelVal);
        resolve();
      });
    });
  }

  private updateUIModel(uiModel: UIModel) {
    this.uiModelVal = null;
    setTimeout(() => {
      this.uiModelVal = uiModel;
      this.uiModelEditor.setValue(formatObjToJsonStr(this.uiModelVal), -1);
      this.uiModelUpdated.emit(uiModel);
      this.controlsPanel.initGroups();
      this.initDrag();
    });
  }

  onComponentsTabSelect() {
    this.uiModelToEdit = null;
    this.dragDropService.deselect();
  }

  onPropertyChange() {
    const model = this.uiModelVal;
    this.uiModelVal = null;
    if (this.showUIModel) {
      window.requestAnimationFrame(() => {
        this.uiModelVal = model;
        this.uiModelUpdated.emit(model);
        this.uiModelEditor.setValue(formatObjToJsonStr(this.uiModelVal), -1);
        this.initDrag();
      });
    }
  }

  onParentSelect() {
    this.dragDropService.selectParent();
  }

  onClone() {
    this.dragDropService.cloneSelected();
  }

  formatJSON(format = true) {
    try {
      const uiModel = JSON.parse(this.uiModelEditor.getValue());
      if (format) {
        this.uiModelEditor.setValue(formatObjToJsonStr(uiModel), -1);
      } else {
        this.uiModelEditor.setValue(JSON.stringify(uiModel), -1);
      }
      this.formatted = format;
      this.error = null;
    } catch (e) {
      console.error(e);
      this.error = e;
      this.formatted = false;
    }
  }

  private tabSelect(i: number) {
    window.requestAnimationFrame(() => {
      try {
        this.tabset.tabs[i].active = true;
      } catch (e) {
        console.error(e);
      }
    });
  }
}