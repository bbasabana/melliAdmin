import { TestBed } from '@angular/core/testing';

import { SelectOptionsService } from './select-options.service';

describe('SelectOptionsService', () => {
  let service: SelectOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
