import { TestBed } from '@angular/core/testing';

import { SuperuserGuard } from './superuser.guard';

describe('SuperuserGuard', () => {
  let guard: SuperuserGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SuperuserGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
