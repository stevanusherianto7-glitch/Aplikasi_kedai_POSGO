import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { BluetoothComponent } from './bluetooth.component'

@NgModule({
  declarations: [BluetoothComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [BluetoothComponent]
})
export class BluetoothModule { }
