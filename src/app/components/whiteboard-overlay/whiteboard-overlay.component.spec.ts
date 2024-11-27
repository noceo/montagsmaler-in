import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhiteboardOverlayComponent } from './whiteboard-overlay.component';

describe('WhiteboardOverlayComponent', () => {
  let component: WhiteboardOverlayComponent;
  let fixture: ComponentFixture<WhiteboardOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhiteboardOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhiteboardOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
