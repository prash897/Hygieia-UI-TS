import {
	AfterViewInit,
	Component,
	OnInit
} from '@angular/core';
import { from } from 'rxjs';
import { NgbProgressbarConfig } from '@ng-bootstrap/ng-bootstrap';
import { IACService } from '../iac.service';
import { IACMasterComponent } from '../iac-master/iac-master.component';
import { Terraform } from '../iac-master/iac-terraform';

@Component({
	selector: 'app-iac-status-line-chart',
	templateUrl: './iac-status-line-chart.component.html',
	styleUrls: ['./iac-status-line-chart.component.sass']
})
export class IACStatusLineChartComponent extends IACMasterComponent implements OnInit, AfterViewInit {

	// Importing Terraform Type
	terraform : Terraform;
	
	// Inherited Properties
	stage: string;
	message: string;

	// Custom Properties
	// the date will be brought from REST
	data: any;
	title: string = "Status Bar View";
	view = [340, 400];
	
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
	
	showRefLines=true;
	showRefLabels=true;
	// graph options
	xAxis = true;
	yAxis = true;
	gradient = false;
	showLegend = true;
	showXAxisLabel = true;
	xAxisLabel = 'Status';
	showYAxisLabel = true;
	yAxisLabel = 'Count';
	showDataLabel  = true;
	activeEntries = ["test"];
	legendOptions = ["test"];
	showGridLines=false;
	// dropdown props
	timelines: string[];
	range: any;
	trimXAxisTicks = false;
	trimYAxisTicks = false;
	barPadding = 8;
	groupPadding  = 16;

	organization: any[];
	workspace: any[];
	status: any[];

	dataPoint: any; // ading one default to keep the full filling at bay, known issue

	constructor(private iacService: IACService,
		config: NgbProgressbarConfig,
		terraform : Terraform) {
		super(iacService, config)
		this.terraform = terraform;
	}

	// custom init
	ngOnInit() {
	}

	// custom view properties and periodic job to auto refresh the data
	ngAfterViewInit() {
		this.startRefreshInterval();
		this.timelines = ['Day', 'Week', 'Minute'];
		this.range = ['Today', 'Last 2 Days', 'Last 3 Days', 'Last 4 Days'];
		this.organization = [{ id: -1, name: "Select Orghanization" }];
		this.workspace = [{ id: -1, name: "Select Workspace" }];
		this.status = ["All"];
	}

	startRefreshInterval() {
		this.observer.subscribe(x => {
			console.log("fetching")
			this.iacService._GetTerraformDetails().subscribe((result => {
				this.data = result.data;

				if (result.status == "PASS") {
					this.organization = [{ id: -1, name: "Select Orghanization" }];
					from(this.data.orgList).pipe().subscribe(org => {

						if (this.organization.indexOf(org['name']) < 0) {
					//		this.stage = "LOADING";
							this.organization.push({ id: org['organizationId'], name: org['name'] });
						}
					});

				}
			}),
				err => {
					this.data = [];
					this.stage = "ERROR";
				}, () => { this.stage = "PASS"; }

			);
		});

	}


	stopRefreshInterval() {
	}



	private populateRange(event) {
		if (event) {
			switch (event.value.toUpperCase()) {
				case 'DAY': this.range = ['Today', 'Last 2 Days', 'Last 3 Days', 'Last 4 Days'];
					break;

				case 'WEEK': this.range = ['This Week', 'Last 2 Weeks', 'Last 3 Weeks', 'Last 4 Weeks'];
					break;

				case 'MINUTE': this.range = [10, 20, 30, 40, 50];
					break;
			}
		}
	}

	private populateWorkspace(event) {

		this.workspace = [{ id: -1, name: "Select Workspace" }];
		this.status = ["All"];
		if (event.value == -1)
			return;

		from(this.data.orgList).pipe().subscribe(org => {

			if (org['name'] == event.value) {
				from(org['workSpaceList']).pipe().subscribe(ws => {

					if (this.workspace.indexOf(ws['name']) < 0) {
						this.workspace.push({ id: ws['workspaceId'], name: ws['name'] });
					}
				}
				)
			}

		}, err => { }, () => { }
		);
	}

	populateStatus(orgEvent, wsEvent) {

		this.status = ["All"];

		if (orgEvent.value == -1 || wsEvent.value == -1)
			return;


		from(this.data.orgList).pipe().subscribe(org => {

			if (org['name'] == orgEvent.value) {

				from(org['workSpaceList']).pipe().subscribe(

					ws => {
						if (ws['workspaceId'] == wsEvent.value) {
							from(ws['runList']).pipe().subscribe(
								x => {
									if (this.status.indexOf(x['status']) < 0) {
										this.status.push(x['status']);
									}
								}

							)

						}
					}


				)
			}

		}, err => { }, () => { });
	}


	test = [];

	populateChart(wsEvent, statusEvent, timelineEvent, rangeEvent) {
		this.test = [];
		this.dataPoint = [];
		if (wsEvent.value == -1 || statusEvent.value == -1)
			return;

		var workspace = wsEvent.value;
		var status = statusEvent.value;
		var timeline = timelineEvent == null ? this.timelines[0] : timelineEvent.value;
		var range = rangeEvent == null ? this.range[0] : rangeEvent.value;

		switch (range) {
			case 'Today':
				range = 1;
				break;
			case 'Last 2 Days':
				range = 2;
				break;
			case 'Last 3 Days':
				range = 3;
				break;
			case 'Last 4 Days':
				range = 4;
				break;
			case 'This Week':
				range = 1;
				break;
			case 'Last 2 Weeks':
				range = 2;
				break;
			case 'Last 3 Weeks':
				range = 3;
				break;
			case 'Last 4 Weeks':
				range = 4;
				break;
		}

		this.iacService.
			_GetTerraformDetailAggregateRunRoute(workspace, status, timeline, range).subscribe(result => {
				from(result.data).pipe().subscribe(d => {
					let temp = { };
			
			
			temp['name'] = d['name'];
			temp['series'] = d['value'];
			
			
			this.test.push(temp); 
			 
			},
			 err => {
				
			}, () => {
				
				this.dataPoint = this.test;
			});

	});
	
	}

}
