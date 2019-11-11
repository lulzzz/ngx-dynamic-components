import { Component, OnInit, Input, SimpleChanges, OnChanges, HostBinding, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { UIModel, NGXDynamicComponent } from '@ngx-dynamic-components/core';
import { FormControl } from '@angular/forms';
import { filter, map, startWith, debounceTime } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { Interpreter } from 'pscript-interpreter';

import { DragDropService } from '../../services/drag-drop.service';

enum Layout {
  horizontal = 'column',
  vertical = 'row'
}

@Component({
  selector: 'dc-preview-editor',
  templateUrl: './preview-editor.component.html',
  styleUrls: ['./preview-editor.component.scss']
})
export class PreviewEditorComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() scripts: string;
  @Input() initUiModel: UIModel;
  @Input() initDataModel: any;
  @Input() title: string;
  @HostBinding('style.flex') flex = 'initial';

  uiModel: UIModel;
  dataModel: any;

  uiModelControl: FormControl;
  dataModelControl: FormControl;
  scriptControl: FormControl;
  interpreter: Interpreter;

  @ViewChild('dynamicComponent', {static: false}) dynamicComponent: NGXDynamicComponent;

  layout: Layout = Layout.vertical;

  sourceCode = false;
  editMode$ = new BehaviorSubject<boolean>(false);
  editorOptions = {
    language: 'json',
    automaticLayout: true
  };

  get editorTooltip$() {
    return this.editMode$.pipe(map(edit => edit ? 'Disable preview edit' : 'Enable preview edit'));
  }

  constructor(private container: ElementRef, private dragService: DragDropService) { }

  ngOnInit() {
    this.interpreter = Interpreter.create();
    this.initUIPreview();
    this.editMode$.subscribe(editMode => {
      if (editMode) {
        this.dragService.init(this.container, this.uiModel);
      } else {
        this.dragService.cleanUpEditor();
      }
    });
  }

  ngOnChanges({initUiModel}: SimpleChanges) {
    if (initUiModel && !initUiModel.firstChange) {
      this.initUIPreview();
    }
  }

  ngAfterViewInit() {
    this.onDataModelChange(this.dynamicComponent.dataModel);
  }

  get isHorizontal() {
    return this.layout === Layout.horizontal;
  }

  toggleSourceCode() {
    this.sourceCode = !this.sourceCode;
    this.flex = this.sourceCode ? '1 1 auto' : 'initial';
    if (!this.sourceCode) {
      this.layout = Layout.horizontal;
    }
  }

  toggleLayout() {
    this.layout = this.layout === Layout.horizontal ? Layout.vertical : Layout.horizontal;
  }

  addRow() {
    this.uiModel.children.unshift({
      type: 'bootstrap:bs-row',
      containerProperties: {},
      itemProperties: {},
      children: []
    });
    this.refreshPreview(this.uiModel, this.dataModel);
    this.onDataModelChange(null);
  }

  onDataModelChange(data: any) {
    if (data) {
      this.dataModelControl.setValue(JSON.stringify(data, null, 4));
    } else {
      this.uiModelControl.setValue(JSON.stringify(this.uiModel, null, 4));
    }
  }

  private initUIPreview() {
    this.initUIModelControl().subscribe(uiModel => this.refreshPreview(uiModel, this.dataModel));
    this.initDataModelControl().subscribe(dataModel => this.refreshPreview(this.uiModel, dataModel));
    this.initScriptsControl();
    this.dragService.uiModelUpdates$.subscribe(() => this.onDataModelChange(null));
  }

  private refreshPreview(uiModel: UIModel, dataModel: any) {
    this.uiModel = uiModel;
    this.dataModel = dataModel;
    if (this.scriptControl) {
      this.scriptControl.setValue(this.scripts);
    }

    if (this.editMode$.value) {
      setTimeout(() => {
        this.dragService.init(this.container, uiModel);
      }, 1e1);
    }
  }

  private initUIModelControl(): Observable<any> {
    const strUiModel = JSON.stringify(this.initUiModel, null, 4);
    this.uiModelControl = new FormControl(strUiModel);
    return this.uiModelControl.valueChanges
      .pipe(
        filter(this.jsonValidFilter),
        startWith(strUiModel),
        map(str => JSON.parse(str)));
  }

  private initDataModelControl(): Observable<any> {
    const strDataModel = JSON.stringify(this.initDataModel, null, 4);
    this.dataModelControl = new FormControl(strDataModel);
    return this.dataModelControl.valueChanges
      .pipe(
        debounceTime(5e2),
        filter(this.jsonValidFilter),
        startWith(strDataModel),
        map(str => JSON.parse(str)));
  }

  private initScriptsControl() {
    this.scriptControl = new FormControl(this.scripts);
    this.scriptControl.valueChanges.subscribe(sc => {
      this.scripts = sc;
    });
  }

  private jsonValidFilter(jsonStr: string): boolean {
    try {
      JSON.parse(jsonStr);
      return true;
    } catch {
      return false;
    }
  }
}
