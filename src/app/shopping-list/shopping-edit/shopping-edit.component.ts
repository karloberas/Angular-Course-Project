import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { Ingredient } from 'src/app/shared/ingredient.model';
import * as ShoppingListActions from '../store/shopping-list.actions';
import * as fromApp from '../../store/app.reducer';

@Component({
  selector: 'app-shopping-edit',
  templateUrl: './shopping-edit.component.html',
  styleUrls: ['./shopping-edit.component.css']
})
export class ShoppingEditComponent implements OnInit, OnDestroy {
  @ViewChild('f') form: NgForm;
  editSubscription: Subscription;
  editMode = false;
  editingItemIndex: number;
  editingItem: Ingredient;

  constructor(
    private store: Store<fromApp.AppState>) { }

  ngOnInit() {
    this.editSubscription = this.store.select('shoppingList').subscribe((stateData) => {
      if (stateData.editedIngredientIndex > -1) {
        this.editMode = true;
        this.editingItem = stateData.editedIngredient;
        this.form.setValue({
          name: this.editingItem.name,
          amount: this.editingItem.amount
        });
      }
      else {
        this.editMode = false;
      }
    })
    // this.editSubscription = this.shoppingListService.startEditing.subscribe((index: number) => {
    //   this.editMode = true;
    //   this.editingItemIndex = index;
    //   this.editingItem = this.shoppingListService.getIngredient(index);
    //   this.form.setValue({
    //     name: this.editingItem.name,
    //     amount: this.editingItem.amount
    //   });
    // });
  }

  onSubmit() {
    const name = this.form.value.name;
    const amount = this.form.value.amount;
    const newIngredient = new Ingredient(name, amount);
    if (!this.editMode) {
      // this.shoppingListService.addIngredient(newIngredient);
      this.store.dispatch(new ShoppingListActions.AddIngredient(newIngredient));
    }
    else {
      // this.shoppingListService.updateIngredient(this.editingItemIndex, newIngredient);
      this.store.dispatch(new ShoppingListActions.UpdateIngredient(newIngredient));
    }
    this.onClear();
  }

  onDelete() {
    // this.shoppingListService.deleteIngredient(this.editingItemIndex);
    this.store.dispatch(new ShoppingListActions.DeleteIngredient());
    this.onClear();
  }

  onClear() {
    this.editMode = false;
    this.form.reset();
    this.store.dispatch(new ShoppingListActions.StopEdit());
  }

  ngOnDestroy() {
    this.editSubscription.unsubscribe();
    this.store.dispatch(new ShoppingListActions.StopEdit());
  }
}
