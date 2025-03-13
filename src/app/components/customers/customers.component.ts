import { Component } from '@angular/core';
import { ManagementService } from '../../services/management.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-customers',
  imports: [],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent {
  client: Client = {
    name: '',
    phoneNumber: '',
    totalSpent: 0,
    points: 0
  };

  constructor(private firebaseService: ManagementService) {}

  addClient() {
    this.client.points = Math.floor((this.client.totalSpent / 5000) * 2);
    this.firebaseService.addClient(this.client);
  }

}
