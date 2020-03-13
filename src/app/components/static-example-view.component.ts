import { Component, OnInit } from '@angular/core';
import { EXAMPLES_LIST } from '../examples/examples.config';
import { ActivatedRoute, Router } from '@angular/router';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Interpreter } from 'jspython-interpreter';

@Component({
  selector: 'dc-static-example',
  template: `
    <ng-container *ngIf="ex">
      <ngx-dynamic-component #dynamicComponent
        [uiModel]='ex.uiModel'
        [dataModel]='ex.dataModel'
        [interpreter]='interpreter'
        [scripts]='ex.scripts'></ngx-dynamic-component>
    </ng-container>
  `,
  styles: [`
    :host {
      padding: 25px;
      flex-grow: 1;
      display: flex;
    }
  `]
})
export class StaticExampleViewComponent implements OnInit {
  example: Observable<any>;

  ex: any;
  interpreter: Interpreter;

  constructor(private route: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
    this.example = this.route.params
      .pipe(
        filter(p => p.example),
        map(p => {
          const config = EXAMPLES_LIST.find(({name}) => p.example === name);
          return config;
        }));

    this.example.subscribe(e => {
      this.ex = e;
      this.interpreter = Interpreter.create();
    });

    this.route.params.subscribe(({example}) => {
      if (!example) {
        // Redirect to first example if it is not selected.
        this.router.navigate(['static/examples', EXAMPLES_LIST[0].name]);
      }
    });
  }
}