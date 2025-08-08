import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { OpenAPIV3 } from 'openapi-types';

// Swagger 3.0 spec as a constant
const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Sample API',
    version: '1.0.0'
  },
  servers: [
    { url: 'https://api.example.com/v1' }
  ],
  paths: {
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID'
          },
          {
            name: 'include',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Include related resources'
          },
          {
            name: 'format',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['json', 'xml'] },
            description: 'Response format'
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'User identifier' },
                    name: { type: 'string', description: 'User full name' },
                    email: { type: 'string', format: 'email', description: 'User email address' },
                    age: { type: 'integer', minimum: 0, description: 'User age' },
                    active: { type: 'boolean', description: 'User status' }
                  },
                  required: ['id', 'name', 'email']
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update user',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'User full name' },
                  email: { type: 'string', format: 'email', description: 'User email address' },
                  age: { type: 'integer', minimum: 0, description: 'User age' },
                  active: { type: 'boolean', description: 'User status' }
                },
                required: ['name', 'email']
              }
            }
          }
        },
        responses: {
          '200': { description: 'User updated successfully' }
        }
      }
    }
  }
};

type ParameterDefinition = OpenAPIV3.ParameterObject;

interface BodyProperty {
  name: string;
  type: string;
  format?: string;
  required: boolean;
  description?: string;
  enum?: (string | number)[];
  minimum?: number;
  maximum?: number;
}

interface DesignerUIState {
  selectedPath: string;
  selectedMethod: string;
  pathParams: { [key: string]: any };
  queryParams: { [key: string]: any };
  headers: { [key: string]: string };
  bodyValues: { [key: string]: any };
}

interface EffectiveRequest {
  method: string;
  url: string;
  headers: { [key: string]: string };
  body?: any;
}

@Component({
  selector: 'app-swagger-api-designer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatExpansionModule
  ],
  template: `
    <div class="api-designer-container">
      <!-- Request Configuration Header -->
      <mat-card class="request-config-card">
        <mat-card-content>
          <div class="request-header">
            <div class="method-path-selector">
              <mat-form-field appearance="outline" class="method-field">
                <mat-label>Method</mat-label>
                <mat-select [formControl]="methodControl" (selectionChange)="onMethodChange()">
                  <mat-option *ngFor="let method of availableMethods()" [value]="method">
                    {{ method.toUpperCase() }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="path-field">
                <mat-label>Path</mat-label>
                <mat-select [formControl]="pathControl" (selectionChange)="onPathChange()">
                  <mat-option *ngFor="let path of availablePaths()" [value]="path">
                    {{ path }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="request-url">
              <mat-form-field appearance="outline" class="url-field">
                <mat-label>Full URL</mat-label>
                <input matInput [value]="fullUrl()" readonly>
              </mat-form-field>
              
              <button mat-raised-button color="primary" (click)="sendRequest()" class="send-button">
                <mat-icon>send</mat-icon>
                Send
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Main Content Tabs -->
      <mat-card class="content-card">
        <mat-tab-group>
          <!-- Parameters Tab -->
          <mat-tab label="Params">
            <div class="tab-content">
              <!-- Path Parameters -->
              <div *ngIf="pathParameters().length > 0" class="param-section">
                <h3>Path Variables</h3>
                <div class="param-table">
                  <div class="param-header">
                    <div class="param-col-key">KEY</div>
                    <div class="param-col-value">VALUE</div>
                    <div class="param-col-description">DESCRIPTION</div>
                  </div>
                  <div *ngFor="let param of pathParameters(); trackBy: trackByParamName" class="param-row">
                    <div class="param-col-key">
                      <mat-form-field appearance="outline">
                        <input matInput [value]="param.name" readonly 
                               [matTooltip]="getParamTooltip(param)">
                      </mat-form-field>
                    </div>
                    <div class="param-col-value">
                      <mat-form-field appearance="outline">
                        <input matInput 
                               [placeholder]="getParamPlaceholder(param)"
                               [formControl]="getPathParamControl(param.name)">
                      </mat-form-field>
                    </div>
                    <div class="param-col-description">
                      <mat-form-field appearance="outline">
                        <input matInput [value]="param.description || ''" readonly>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Query Parameters -->
              <div *ngIf="queryParameters().length > 0" class="param-section">
                <h3>Query Parameters</h3>
                <div class="param-table">
                  <div class="param-header">
                    <div class="param-col-key">KEY</div>
                    <div class="param-col-value">VALUE</div>
                    <div class="param-col-description">DESCRIPTION</div>
                  </div>
                  <div *ngFor="let param of queryParameters(); trackBy: trackByParamName" class="param-row">
                    <div class="param-col-key">
                      <mat-form-field appearance="outline">
                        <input matInput [value]="param.name" readonly 
                               [matTooltip]="getParamTooltip(param)">
                      </mat-form-field>
                    </div>
                    <div class="param-col-value">
                      <mat-form-field appearance="outline" *ngIf="!isEnumParameter(param)">
                        <input matInput
                               [placeholder]="getParamPlaceholder(param)"
                               [formControl]="getQueryParamControl(param.name)">
                      </mat-form-field>
                      <mat-form-field appearance="outline" *ngIf="isEnumParameter(param)">
                        <mat-select [formControl]="getQueryParamControl(param.name)">
                          <mat-option value="">-- Select --</mat-option>
                          <mat-option *ngFor="let option of getEnumValues(param)" [value]="option">
                            {{ option }}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                    <div class="param-col-description">
                      <mat-form-field appearance="outline">
                        <input matInput [value]="param.description || ''" readonly>
                      </mat-form-field>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="pathParameters().length === 0 && queryParameters().length === 0" class="no-params">
                <p>No parameters defined for this endpoint.</p>
              </div>
            </div>
          </mat-tab>

          <!-- Headers Tab -->
          <mat-tab label="Headers">
            <div class="tab-content">
              <div class="headers-section">
                <div class="section-header">
                  <h3>Headers</h3>
                  <button mat-button color="primary" (click)="addCustomHeader()">
                    <mat-icon>add</mat-icon>
                    Add Header
                  </button>
                </div>

                <div class="headers-table">
                  <div class="header-row" *ngFor="let header of customHeadersArray().controls; let i = index; trackBy: trackByIndex">
                    <mat-form-field appearance="outline" class="header-key">
                      <mat-label>Key</mat-label>
                      <input matInput [formControl]="getCustomHeaderKeyControl(i)">
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" class="header-value">
                      <mat-label>Value</mat-label>
                      <input matInput [formControl]="getCustomHeaderValueControl(i)">
                    </mat-form-field>
                    
                    <button mat-icon-button color="warn" (click)="removeCustomHeader(i)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>

                  <div *ngIf="customHeadersArray().length === 0" class="no-headers">
                    <p>No custom headers added.</p>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Body Tab -->
          <mat-tab label="Body">
            <div class="tab-content">
              <div *ngIf="bodyProperties().length > 0" class="body-section">
                <h3>Request Body (application/json)</h3>
                <div class="body-form">
                  <div *ngFor="let prop of bodyProperties(); trackBy: trackByPropertyName" class="body-property">
                    <mat-form-field appearance="outline" class="property-field">
                      <mat-label>{{ prop.name }}{{ prop.required ? ' *' : '' }}</mat-label>
                      
                      <!-- String/Text Input -->
                      <input matInput 
                             *ngIf="prop.type === 'string' && !prop.enum"
                             [formControl]="getBodyPropertyControl(prop.name)"
                             [placeholder]="getBodyPropertyPlaceholder(prop)"
                             [matTooltip]="getBodyPropertyTooltip(prop)">
                      
                      <!-- Number Input -->
                      <input matInput 
                             type="number"
                             *ngIf="prop.type === 'integer' || prop.type === 'number'"
                             [formControl]="getBodyPropertyControl(prop.name)"
                             [placeholder]="getBodyPropertyPlaceholder(prop)"
                             [matTooltip]="getBodyPropertyTooltip(prop)">
                      
                      <!-- Enum Select -->
                      <mat-select *ngIf="prop.enum" [formControl]="getBodyPropertyControl(prop.name)">
                        <mat-option value="">-- Select --</mat-option>
                        <mat-option *ngFor="let option of prop.enum" [value]="option">
                          {{ option }}
                        </mat-option>
                      </mat-select>
                      
                      <!-- Boolean Select -->
                      <mat-select *ngIf="prop.type === 'boolean'" [formControl]="getBodyPropertyControl(prop.name)">
                        <mat-option value="">-- Select --</mat-option>
                        <mat-option [value]="true">true</mat-option>
                        <mat-option [value]="false">false</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
              </div>

              <div *ngIf="bodyProperties().length === 0" class="no-body">
                <p>No request body defined for this endpoint.</p>
              </div>
            </div>
          </mat-tab>

          <!-- Scripts Tab (Placeholder) -->
          <mat-tab label="Scripts">
            <div class="tab-content placeholder-content">
              <h3>Pre-request & Test Scripts</h3>
              <p>Script functionality will be implemented in future versions.</p>
            </div>
          </mat-tab>

          <!-- Settings Tab (Placeholder) -->
          <mat-tab label="Settings">
            <div class="tab-content placeholder-content">
              <h3>Request Settings</h3>
              <p>Settings functionality will be implemented in future versions.</p>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .api-designer-container {
      max-width: 1200px;
      margin: 20px auto;
      padding: 0 20px;
    }

    .request-config-card {
      margin-bottom: 20px;
    }

    .request-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .method-path-selector {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .method-field {
      min-width: 120px;
      flex-shrink: 0;
    }

    .path-field {
      flex: 1;
      min-width: 300px;
    }

    .request-url {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .url-field {
      flex: 1;
    }

    .send-button {
      height: 56px;
      padding: 0 24px;
      flex-shrink: 0;
    }

    .content-card {
      min-height: 500px;
    }

    .tab-content {
      padding: 24px;
      min-height: 400px;
    }

    .param-section {
      margin-bottom: 32px;
    }

    .param-section h3 {
      margin: 0 0 16px 0;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .param-table {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .param-header {
      display: flex;
      background-color: #f5f5f5;
      font-weight: 500;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      padding: 12px 0;
    }

    .param-row {
      display: flex;
      border-top: 1px solid #e0e0e0;
      padding: 8px 0;
    }

    .param-col-key {
      flex: 0 0 200px;
      padding: 0 12px;
    }

    .param-col-value {
      flex: 1;
      padding: 0 12px;
    }

    .param-col-description {
      flex: 1;
      padding: 0 12px;
    }

    .param-header .param-col-key,
    .param-header .param-col-value,
    .param-header .param-col-description {
      display: flex;
      align-items: center;
    }

    .headers-section {
      width: 100%;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      margin: 0;
      font-weight: 500;
    }

    .headers-table {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .header-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .header-key {
      flex: 0 0 200px;
    }

    .header-value {
      flex: 1;
    }

    .body-section h3 {
      margin: 0 0 24px 0;
      font-weight: 500;
    }

    .body-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      max-width: 800px;
    }

    .body-property {
      width: 100%;
    }

    .property-field {
      width: 100%;
    }

    .no-params,
    .no-headers,
    .no-body {
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
      padding: 40px 20px;
    }

    .placeholder-content {
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
    }

    .placeholder-content h3 {
      margin-bottom: 16px;
    }

    mat-form-field {
      width: 100%;
    }

    @media (max-width: 768px) {
      .request-header {
        gap: 12px;
      }

      .method-path-selector {
        flex-direction: column;
        gap: 12px;
      }

      .method-field {
        min-width: auto;
      }

      .request-url {
        flex-direction: column;
        gap: 12px;
      }

      .send-button {
        height: 48px;
        width: 100%;
      }

      .param-header {
        font-size: 12px;
      }

      .param-col-key {
        flex: 0 0 120px;
      }

      .header-row {
        flex-direction: column;
        gap: 8px;
      }

      .header-key {
        flex: none;
      }

      .body-form {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SwaggerApiDesignerComponent implements OnInit {
  // Form controls
  pathControl: FormControl<string>;
  methodControl: FormControl<string>;
  
  // Main form groups
  pathParamsForm: FormGroup;
  queryParamsForm: FormGroup;
  bodyForm: FormGroup;
  customHeadersForm: FormGroup;

  // Internal state signals
  private currentSpec = signal<OpenAPIV3.Document>(swaggerSpec);
  private designerUIState = signal<DesignerUIState>({
    selectedPath: '/users/{id}',
    selectedMethod: 'get',
    pathParams: {},
    queryParams: {},
    headers: {},
    bodyValues: {}
  });

  // Computed signals
  availablePaths = computed<string[]>(() => Object.keys(this.currentSpec().paths || {}));
  
  availableMethods = computed<string[]>(() => {
    const selectedPath = this.designerUIState().selectedPath;
    const paths = this.currentSpec().paths;
    if (paths && paths[selectedPath]) {
      return Object.keys(paths[selectedPath] as OpenAPIV3.PathItemObject);
    }
    return [];
  });

  currentOperation = computed<OpenAPIV3.OperationObject | undefined>(() => {
    const state = this.designerUIState();
    const pathItem = this.currentSpec().paths?.[state.selectedPath] as OpenAPIV3.PathItemObject;
    if (pathItem) {
      return pathItem[state.selectedMethod.toLowerCase() as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject;
    }
    return undefined;
  });

  pathParameters = computed<OpenAPIV3.ParameterObject[]>(() => {
    const operation = this.currentOperation();
    return (operation?.parameters as OpenAPIV3.ParameterObject[] || []).filter(p => p.in === 'path');
  });

  queryParameters = computed<OpenAPIV3.ParameterObject[]>(() => {
    const operation = this.currentOperation();
    return (operation?.parameters as OpenAPIV3.ParameterObject[] || []).filter(p => p.in === 'query');
  });

  bodyProperties = computed<BodyProperty[]>(() => {
    const operation = this.currentOperation();
    const requestBody = operation?.requestBody as OpenAPIV3.RequestBodyObject;
    const jsonContent = requestBody?.content?.['application/json'];
    const schema = jsonContent?.schema as OpenAPIV3.SchemaObject;
    
    if (!schema || schema.type !== 'object' || !schema.properties) {
      return [];
    }

    return Object.entries(schema.properties)
      .filter((entry): entry is [string, OpenAPIV3.SchemaObject] => this.isSchemaObject(entry[1]))
      .map(([name, propSchema]) => ({
        name,
        type: propSchema.type as string,
        format: propSchema.format,
        required: (schema.required || []).includes(name),
        description: propSchema.description,
        enum: propSchema.enum,
        minimum: propSchema.minimum,
        maximum: propSchema.maximum
      }));
  });

  fullUrl = computed(() => {
    const state = this.designerUIState();
    const baseUrl = this.currentSpec().servers?.[0]?.url || '';
    let path = state.selectedPath;
    
    // Substitute path parameters
    for (const [key, value] of Object.entries(state.pathParams)) {
      if (value) {
        path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
      }
    }
    
    // Add query parameters
    const queryString = Object.entries(state.queryParams)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    const fullPath = queryString ? `${path}?${queryString}` : path;
    return `${baseUrl}${fullPath}`;
  });

  effectiveRequest = computed((): EffectiveRequest => {
    const state = this.designerUIState();
    const request: EffectiveRequest = {
      method: state.selectedMethod.toUpperCase(),
      url: this.fullUrl(),
      headers: {
        'Content-Type': 'application/json',
        ...state.headers
      }
    };

    // Add body if it's not a GET request and has body content
    if (state.selectedMethod !== 'get') {
      const bodyValues = Object.entries(state.bodyValues)
        .filter(([, value]) => value !== null && value !== undefined && value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      if (Object.keys(bodyValues).length > 0) {
        request.body = bodyValues;
      }
    }

    return request;
  });

  constructor(private fb: FormBuilder) {
    this.pathControl = this.fb.nonNullable.control('/users/{id}');
    this.methodControl = this.fb.nonNullable.control('get');
    this.pathParamsForm = this.fb.nonNullable.group({});
    this.queryParamsForm = this.fb.nonNullable.group({});
    this.bodyForm = this.fb.nonNullable.group({});
    this.customHeadersForm = this.fb.nonNullable.group({
      headers: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.initializeForms();
    this.setupFormSubscriptions();
  }

  // Form initialization methods
  private initializeForms(): void {
    this.initializePathParamsForm();
    this.initializeQueryParamsForm();
    this.initializeBodyForm();
  }

  private initializePathParamsForm(): void {
    const controls: { [key: string]: FormControl } = {};
    this.pathParameters().forEach((param: OpenAPIV3.ParameterObject) => {
      controls[param.name] = this.fb.nonNullable.control('',
        param.required ? [Validators.required] : []
      );
    });
    this.pathParamsForm = this.fb.nonNullable.group(controls);
  }

  private initializeQueryParamsForm(): void {
    const controls: { [key: string]: FormControl } = {};
    this.queryParameters().forEach((param: OpenAPIV3.ParameterObject) => {
      controls[param.name] = this.fb.nonNullable.control('',
        param.required ? [Validators.required] : []
      );
    });
    this.queryParamsForm = this.fb.nonNullable.group(controls);
  }

  private initializeBodyForm(): void {
    const controls: { [key: string]: FormControl } = {};
    this.bodyProperties().forEach(prop => {
      const validators = prop.required ? [Validators.required] : [];
      
      if (prop.type === 'string' && prop.format === 'email') {
        validators.push(Validators.email);
      }
      if (prop.minimum !== undefined) {
        validators.push(Validators.min(prop.minimum));
      }
      if (prop.maximum !== undefined) {
        validators.push(Validators.max(prop.maximum));
      }
      
      controls[prop.name] = this.fb.nonNullable.control('', validators);
    });
    this.bodyForm = this.fb.nonNullable.group(controls);
  }

  // Form subscription setup
  private setupFormSubscriptions(): void {
    // Subscribe to form changes and update internal state
    this.pathParamsForm.valueChanges.subscribe(values => {
      this.updateDesignerState({ pathParams: values });
    });

    this.queryParamsForm.valueChanges.subscribe(values => {
      this.updateDesignerState({ queryParams: values });
    });

    this.bodyForm.valueChanges.subscribe(values => {
      this.updateDesignerState({ bodyValues: values });
    });

    this.customHeadersForm.valueChanges.subscribe(formValue => {
      const headers: { [key: string]: string } = {};
      (formValue.headers || []).forEach((header: { key: string, value: string }) => {
        if (header.key && header.value) {
          headers[header.key] = header.value;
        }
      });
      this.updateDesignerState({ headers });
    });
  }

  // State management methods
  private updateDesignerState(updates: Partial<DesignerUIState>): void {
    this.designerUIState.update(current => ({ ...current, ...updates }));
  }

  // Event handlers
  onPathChange(): void {
    const newPath = this.pathControl.value;
    this.updateDesignerState({ 
      selectedPath: newPath,
      selectedMethod: this.availableMethods()[0] || 'get'
    });
    this.methodControl.setValue(this.designerUIState().selectedMethod);
    this.reinitializeForms();
  }

  onMethodChange(): void {
    const newMethod = this.methodControl.value;
    this.updateDesignerState({ selectedMethod: newMethod });
    this.reinitializeForms();
  }

  private reinitializeForms(): void {
    this.initializeForms();
    this.setupFormSubscriptions();
  }

  // Custom headers management
  customHeadersArray(): FormArray {
    return this.customHeadersForm.get('headers') as FormArray;
  }

  addCustomHeader(): void {
    const headerGroup = this.fb.nonNullable.group({
      key: this.fb.nonNullable.control(''),
      value: this.fb.nonNullable.control('')
    });
    this.customHeadersArray().push(headerGroup);
  }

  removeCustomHeader(index: number): void {
    this.customHeadersArray().removeAt(index);
  }

  getCustomHeaderKeyControl(index: number): FormControl {
    return this.customHeadersArray().at(index).get('key') as FormControl;
  }

  getCustomHeaderValueControl(index: number): FormControl {
    return this.customHeadersArray().at(index).get('value') as FormControl;
  }

  // Form control getters
  getPathParamControl(name: string): FormControl {
    return this.pathParamsForm.get(name) as FormControl;
  }

  getQueryParamControl(name: string): FormControl {
    return this.queryParamsForm.get(name) as FormControl;
  }

  getBodyPropertyControl(name: string): FormControl {
    return this.bodyForm.get(name) as FormControl;
  }

  // Utility methods for display
  isSchemaObject(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): schema is OpenAPIV3.SchemaObject {
    return !('$ref' in schema);
  }

  isEnumParameter(param: OpenAPIV3.ParameterObject): boolean {
    return !!param.schema && this.isSchemaObject(param.schema) && !!param.schema.enum;
  }

  getEnumValues(param: OpenAPIV3.ParameterObject): (string | number)[] {
    if (this.isEnumParameter(param)) {
      const schema = param.schema as OpenAPIV3.SchemaObject;
      return schema.enum || [];
    }
    return [];
  }

  getParamTooltip(param: OpenAPIV3.ParameterObject): string {
    if (!param.schema || !this.isSchemaObject(param.schema)) {
      return '';
    }
    const schema = param.schema;
    const parts = [`Type: ${schema.type || 'unknown'}`];
    if (schema.format) {
      parts.push(`Format: ${schema.format}`);
    }
    if (param.required) {
      parts.push('Required');
    }
    return parts.join(', ');
  }

  getParamPlaceholder(param: OpenAPIV3.ParameterObject): string {
    if (!param.schema || !this.isSchemaObject(param.schema)) {
      return 'Enter value';
    }
    const schema = param.schema;
    if (schema.enum) {
      return 'Select from dropdown';
    }
    return `Enter ${schema.type || 'value'}${param.required ? ' (required)' : ''}`;
  }

  getBodyPropertyTooltip(prop: BodyProperty): string {
    const parts = [`Type: ${prop.type}`];
    if (prop.format) {
      parts.push(`Format: ${prop.format}`);
    }
    if (prop.required) {
      parts.push('Required');
    }
    if (prop.minimum !== undefined) {
      parts.push(`Min: ${prop.minimum}`);
    }
    if (prop.maximum !== undefined) {
      parts.push(`Max: ${prop.maximum}`);
    }
    return parts.join(', ');
  }

  getBodyPropertyPlaceholder(prop: BodyProperty): string {
    if (prop.enum) {
      return 'Select from dropdown';
    }
    if (prop.format === 'email') {
      return 'user@example.com';
    }
    return `Enter ${prop.type}${prop.required ? ' (required)' : ''}`;
  }

  // TrackBy functions
  trackByParamName = (index: number, param: OpenAPIV3.ParameterObject) => param.name;
  trackByPropertyName = (index: number, prop: BodyProperty) => prop.name;
  trackByIndex = (index: number) => index;

  // Main action method
  sendRequest(): void {
    const request = this.effectiveRequest();
    console.log('🚀 Sending Request:', request);
    
    // Here you can add actual HTTP request logic in the future
    // For now, we just log to console as requested
  }
}
