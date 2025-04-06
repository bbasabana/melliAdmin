import { Component } from '@angular/core';
import { NotifictionService } from '../../services/notification/notifiction.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent {
  constructor(public notificationService: NotifictionService) {}
}
