import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Recipe } from '../recipe.model';
import { RecipeService } from '../recipe.service';
import * as fromApp from '../../store/app.reducer';
import { Store } from '@ngrx/store';
import { map, switchMap } from 'rxjs/operators';
import * as RecipesActions from '../store/recipe.actions';

@Component({
    selector: 'app-recipe-detail',
    templateUrl: './recipe-detail.component.html',
    styleUrls: ['./recipe-detail.component.css'],
})
export class RecipeDetailComponent implements OnInit, OnDestroy {
    recipe: Recipe;
    id: number;
    paramsSubscription: Subscription;

    constructor(
        private recipeService: RecipeService,
        private route: ActivatedRoute,
        private router: Router,
        private store: Store<fromApp.AppState>
    ) {}

    ngOnInit() {
        this.paramsSubscription = this.route.params
            .pipe(
                map((params: Params) => {
                    return +params.id;
                }),
                switchMap((id) => {
                    this.id = id;
                    return this.store.select('recipes');
                }),
                map((recipesState) => {
                    return recipesState.recipes.find((recipe, index) => {
                        return index === this.id;
                    });
                })
            )
            .subscribe((recipe) => {
                this.recipe = recipe;
            });
    }

    onAddToShoppingList() {
        this.recipeService.addIngredients(this.recipe.ingredients);
    }

    onDeleteRecipe() {
        // this.recipeService.deleteRecipe(this.id);
        this.store.dispatch(new RecipesActions.DeleteRecipe(this.id));
        this.router.navigate(['/recipes']);
    }

    ngOnDestroy() {
        this.paramsSubscription.unsubscribe();
    }
}
