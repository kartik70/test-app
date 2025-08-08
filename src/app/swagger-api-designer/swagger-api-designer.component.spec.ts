import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwaggerApiDesignerComponent } from './swagger-api-designer.component';

describe('SwaggerApiDesignerComponent', () => {
  let component: SwaggerApiDesignerComponent;
  let fixture: ComponentFixture<SwaggerApiDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwaggerApiDesignerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwaggerApiDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
