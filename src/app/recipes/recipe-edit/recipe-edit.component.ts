import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as fromApp from '../../store/app.reducer';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import * as RecipesActions from '../store/recipe.actions';

@Component({
    selector: 'app-recipe-edit',
    templateUrl: './recipe-edit.component.html',
    styleUrls: ['./recipe-edit.component.css'],
})
export class RecipeEditComponent implements OnInit, OnDestroy {
    paramsSubscription: Subscription;
    id: number;
    editMode = false;
    recipeForm: FormGroup;

    private storeSub: Subscription;

    constructor(private route: ActivatedRoute, private router: Router, private store: Store<fromApp.AppState>) {}

    ngOnInit() {
        this.paramsSubscription = this.route.params.subscribe((params: Params) => {
            this.id = +params.id;
            this.editMode = params.id != null;
            this.initForm();
        });
    }

    ngOnDestroy() {
        this.paramsSubscription.unsubscribe();
        if (this.storeSub) {
            this.storeSub.unsubscribe();
        }
    }

    initForm() {
        let recipeName = '';
        let recipeImagePath = '';
        let recipeDescription = '';
        const recipeIngredients = new FormArray([]);

        if (this.editMode) {
            // const recipe: Recipe = this.recipeService.getRecipe(this.id);
            this.storeSub = this.store
                .select('recipes')
                .pipe(
                    map((recipesState) => {
                        return recipesState.recipes.find((recipe, index) => {
                            return index === this.id;
                        });
                    })
                )
                .subscribe((recipe) => {
                    recipeName = recipe.name;
                    recipeImagePath = recipe.imagePath;
                    recipeDescription = recipe.description;
                    if (recipe.ingredients) {
                        for (const ingredient of recipe.ingredients) {
                            recipeIngredients.push(
                                new FormGroup({
                                    name: new FormControl(ingredient.name, Validators.required),
                                    amount: new FormControl(ingredient.amount, [
                                        Validators.required,
                                        Validators.pattern(/^[1-9]+[0-9]*$/),
                                    ]),
                                })
                            );
                        }
                    }
                });
        }

        this.recipeForm = new FormGroup({
            name: new FormControl(recipeName, Validators.required),
            imagePath: new FormControl(recipeImagePath, Validators.required),
            description: new FormControl(recipeDescription, Validators.required),
            ingredients: recipeIngredients,
        });
    }

    get controls() {
        return (this.recipeForm.get('ingredients') as FormArray).controls;
    }

    onSubmit() {
        if (this.editMode) {
            // this.recipeService.updateRecipe(this.id, this.recipeForm.value);
            this.store.dispatch(new RecipesActions.UpdateRecipe({ index: this.id, recipe: this.recipeForm.value }));
        } else {
            // this.recipeService.addRecipe(this.recipeForm.value);
            this.store.dispatch(new RecipesActions.AddRecipe(this.recipeForm.value));
        }
        this.onClear();
    }

    onAddIngredient() {
        (this.recipeForm.get('ingredients') as FormArray).push(
            new FormGroup({
                name: new FormControl(null, Validators.required),
                amount: new FormControl(null, [Validators.required, Validators.pattern(/^[1-9]+[0-9]*$/)]),
            })
        );
    }

    onClear() {
        this.recipeForm.reset();
        this.router.navigate(['../'], { relativeTo: this.route });
    }

    onDeleteIngredient(index: number) {
        (this.recipeForm.get('ingredients') as FormArray).removeAt(index);
    }
}
