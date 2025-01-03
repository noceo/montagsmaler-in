import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordGuessPlaceholderComponent } from './word-guess-placeholder.component';

describe('WordGuessPlaceholderComponent', () => {
  let component: WordGuessPlaceholderComponent;
  let fixture: ComponentFixture<WordGuessPlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordGuessPlaceholderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WordGuessPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
