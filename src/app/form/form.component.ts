import { Component, OnInit } from '@angular/core';
import {
  AbstractControl, FormBuilder, FormGroup, Validators, ValidatorFn,
  ValidationErrors, FormArray, FormControl
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';

declare var bootstrap: any;

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {



  employeeForm!: FormGroup;
  isEditMode = false;

  currentTabIndex: number = 0;
  tabIds: string[] = ['personal', 'employment', 'compensation', 'address', 'other'];

  maxDob: string = '';

  employees: any[] = [];

  showForm: boolean = false;

  selectedEmployee: any = null;

  editingEmployeeId: string | null = null;

  searchTerm: string = '';
  filterDepartment: string = '';
  filterStatus: string = '';
  filterHireDate: string = '';
  filteredEmployees: any[] = [];

  uniqueDepartments: string[] = [];
  uniqueStatuses: string[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 10;
  paginatedEmployees: any[] = [];
  totalPages: number = 0;



  tabControlGroups: { [key: string]: string[] } = {
    personal: ['employeeId', 'firstName', 'lastName', 'dob', 'gender', 'email', 'phoneNumber'],
    employment: ['department', 'jobTitle', 'employmentType', 'hireDate', 'employeeStatus', 'manager'],
    compensation: ['salary', 'payFrequency', 'bankAccount'],
    address: ['addressLine1', 'city', 'state', 'postalCode', 'country'],
    other: ['emergencyContactName', 'emergencyContactNumber']
  };


  constructor(private fb: FormBuilder, private http: HttpClient) { }

  get selectedEmployees(): FormArray {
    return this.employeeForm.get('selectedEmployees') as FormArray;
  }
  ngOnInit(): void {

    this.loadEmployees();

    const today = new Date();
    today.setDate(today.getDate() - 1);
    this.maxDob = today.toISOString().split('T')[0];

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });

    this.employeeForm = this.fb.group({
      employeeId: [''],
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z\s.]+$/)]],
      lastName: [''],
      dob: ['', [Validators.required, this.futureDateValidator()]],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],

      department: ['', Validators.required],
      jobTitle: ['', Validators.required],
      employmentType: ['', Validators.required],
      hireDate: ['', Validators.required],
      employeeStatus: ['', Validators.required],
      manager: [''],

      salary: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      payFrequency: ['', Validators.required],
      bankAccount: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],

      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{4,10}$/)]],
      country: ['', Validators.required],

      emergencyContactName: ['', Validators.required],
      emergencyContactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      notes: ['']
    });
  }

  loadEmployees() {
    this.http.get<any[]>('http://localhost:3000/api/employees')
      .subscribe({
        next: (data) => {
          this.employees = data;
          this.filteredEmployees = this.employees;
          this.applyFilter();
          this.uniqueDepartments = [...new Set(data.map(emp => emp.department))];
          this.uniqueStatuses = [...new Set(data.map(emp => emp.employeeStatus))];
          const checkboxes = this.fb.array(this.filteredEmployees.map(() => this.fb.control(false)));
          this.employeeForm.setControl('selectedEmployees', checkboxes);
        },
        error: (err) => console.error('Error loading employees', err)
      });
  }

  onAdd() {
    this.showForm = true;
    this.employeeForm.reset(); 
    this.employeeForm.patchValue({
    employeeId: this.generateEmployeeId()
  });
  }

  onSave() {
    if (this.employeeForm.valid) {
      const payload = this.employeeForm.value;

      if (this.isEditMode && this.editingEmployeeId) {
        this.http.put(`http://localhost:3000/api/employees/${this.editingEmployeeId}`, payload)
          .subscribe({
            next: (response) => {
              console.log('Record updated:', response);
              alert('Employee record updated successfully!');
              this.employeeForm.reset();
              this.showForm = false;
              this.isEditMode = false;
              this.editingEmployeeId = null;
              this.loadEmployees(); 
            },
            error: (error) => {
              console.error('Update failed:', error);
              alert('Failed to update employee. Please try again.');
            }
          });
      } else {
        this.http.post('http://localhost:3000/api/employees/add', payload)
          .subscribe({
            next: (response) => {
              alert('Employee saved successfully!');
              this.employeeForm.reset();
              this.showForm = false;
              this.loadEmployees();
            },
            error: (error) => {
              console.error('Error saving employee:', error);
              alert('Failed to save employee. Please try again.');
            }
          });
      }
    } else {
      alert('Please fill all required fields correctly.');
      this.employeeForm.markAllAsTouched();
    }
  }


  onEdit() {
    const selectedIndexes = this.selectedEmployees.controls
      .map((ctrl: AbstractControl, i: number) => ctrl.value ? i : -1)
      .filter((index: number) => index !== -1);

    if (selectedIndexes.length !== 1) {
      alert('Please select one employee to edit.');
      return;
    }
    const index = selectedIndexes[0];
    const employee = this.employees[index];
    this.employeeForm.patchValue({
      ...employee,
      dob: employee.dob ? employee.dob.split('T')[0] : '',
      hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : ''
    });
    this.editingEmployeeId = employee._id;
    this.isEditMode = true;
    this.showForm = true;
  }

  onCancel() {
    this.employeeForm.reset();
    this.employeeForm.markAsPristine(); 
    this.employeeForm.markAsUntouched();
    this.showForm = false; 
  }

  getCheckboxControl(index: number): FormControl {
    return this.selectedEmployees.at(index) as FormControl;
  }

  toggleAllRows(event: any) {
    const isChecked = event.target.checked;
    this.selectedEmployees.controls.forEach((ctrl: AbstractControl, index: number) => {
      this.selectedEmployees.at(index).setValue(isChecked);
    });
  }

  onDelete() {
    const selectedIndexes = this.selectedEmployees.controls
      .map((ctrl: AbstractControl, i: number) => ctrl.value ? i : -1)
      .filter((index: number) => index !== -1);

    if (selectedIndexes.length === 0) {
      alert('Please select employee to delete.');
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete ${selectedIndexes.length} employee(s)?`);
    if (!confirmDelete) return;

    const deleteRequests = selectedIndexes.map(index => {
      const employeeId = this.employees[index]._id;
      return this.http.delete(`http://localhost:3000/api/employees/${employeeId}`);
    });

    Promise.all(deleteRequests.map(req => req.toPromise()))
      .then(() => {
        alert('Selected employee(s) deleted successfully.');
        this.loadEmployees();
        this.employeeForm.get('selectedEmployees')?.reset();
        this.isEditMode = false;
      })
      .catch(error => {
        console.error('Error deleting employee(s):', error);
        alert('Failed to delete Please try again.');
      });
  }

  navigateTab(step: number) {
    const newIndex = this.currentTabIndex + step;
    if (newIndex < 0 || newIndex >= this.tabIds.length) return;
    const currentTabId = this.tabIds[this.currentTabIndex];
    const currentControls = this.tabControlGroups[currentTabId];
    if (step < 0) {
      this.currentTabIndex = newIndex;
      const tabButton = document.querySelector(`#${this.tabIds[newIndex]}-tab`) as HTMLElement;
      if (tabButton) tabButton.click();
      return;
    }
      currentControls.forEach(controlName => {
      const control = this.employeeForm.get(controlName);
      if (control) {
        control.markAsTouched({ onlySelf: true });
        control.updateValueAndValidity({ onlySelf: true });
      }
    });

    const isCurrentTabValid = currentControls.every(controlName => {
      const control = this.employeeForm.get(controlName);
      return control && control.valid;
    });

    if (isCurrentTabValid) {
      this.currentTabIndex = newIndex;
      const nextTabId = this.tabIds[newIndex];
      const tabButton = document.querySelector(`#${nextTabId}-tab`) as HTMLElement;
      if (tabButton) tabButton.click();
    }
  }

  futureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const selectedDate = new Date(control.value);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return selectedDate > today ? { futureDate: true } : null;
    };
  }

  viewEmployee(emp: any) {
    this.selectedEmployee = emp;
    const modalElement = document.getElementById('viewEmployeeModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  applyFilter() {
    this.filteredEmployees = this.employees.filter(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const matchesSearch = this.searchTerm === '' || (
        emp.employeeId.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fullName.includes(this.searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      const matchesDepartment = this.filterDepartment === '' || emp.department === this.filterDepartment;
      const matchesStatus = this.filterStatus === '' || emp.employeeStatus === this.filterStatus;
      const matchesHireDate = this.filterHireDate === '' ||
        (emp.hireDate && new Date(emp.hireDate).toISOString().slice(0, 10) === this.filterHireDate);
      return matchesSearch && matchesDepartment && matchesStatus && matchesHireDate;
    });
    const checkboxes = this.fb.array(this.filteredEmployees.map(() => this.fb.control(false)));
    this.employeeForm.setControl('selectedEmployees', checkboxes);
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedEmployees();
  }

  updatePaginatedEmployees() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
    const checkboxes = this.fb.array(this.paginatedEmployees.map(() => this.fb.control(false)));
    this.employeeForm.setControl('selectedEmployees', checkboxes);
  }

  generateEmployeeId(): string {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return 'EMP' + randomNumber;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedEmployees();
    }
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input?.value || '';
    this.applyFilter();
  }

  onDepartmentChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.filterDepartment = select?.value || '';
    this.applyFilter();
  }

  onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.filterStatus = select?.value || '';
    this.applyFilter();
  }

  onHireDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filterHireDate = input?.value || '';
    this.applyFilter();
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterDepartment = '';
    this.filterStatus = '';
    this.filterHireDate = '';
    this.applyFilter();
  }
}
