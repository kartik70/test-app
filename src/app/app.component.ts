import { Component } from '@angular/core';
import { SwaggerApiDesignerComponent } from './swagger-api-designer/swagger-api-designer.component';
import { ChatComponent } from "./chat/chat.component";
import { DiagramComponent } from './canvas/canvas.component';

@Component({
  selector: 'app-root',
  imports: [SwaggerApiDesignerComponent, ChatComponent, DiagramComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'test-app';
}
