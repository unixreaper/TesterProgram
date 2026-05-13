use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestPlan {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub feature_module: String,
    pub testing_goal: String,
    pub scope_in: String,
    pub scope_out: String,
    pub tester_name: String,
    pub start_date: String,
    pub end_date: String,
    pub test_environment: String,
    pub risks_notes: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestCase {
    pub id: i64,
    pub test_case_id: String,
    pub title: String,
    pub case_type: String,
    pub related_feature: String,
    pub module_ids: Vec<i64>,
    pub module_names: Vec<String>,
    pub priority: String,
    pub preconditions: String,
    pub steps: String,
    pub test_data: String,
    pub expected_result: String,
    pub actual_result: String,
    pub status: String,
    pub bug_id_or_comments: String,
    pub notes: String,
    pub linked_plan_ids: Vec<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChecklistItem {
    pub id: i64,
    pub plan_id: i64,
    pub title: String,
    pub done: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestResultRecord {
    pub id: i64,
    pub case_id: i64,
    pub plan_id: Option<i64>,
    pub result_status: String,
    pub tested_by: String,
    pub environment: String,
    pub tested_device: String,
    pub actual_result: String,
    pub bug_id_or_comments: String,
    pub attachments: Vec<String>,
    pub executed_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardData {
    pub projects: Vec<Project>,
    pub modules: Vec<ProjectModule>,
    pub plans: Vec<TestPlan>,
    pub cases: Vec<TestCase>,
    pub checklists: Vec<ChecklistItem>,
    pub test_results: Vec<TestResultRecord>,
    pub environments: Vec<EnvironmentOption>,
    pub devices: Vec<DeviceOption>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentOption {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceOption {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectModule {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TestCaseIdSettings {
    pub prefix: String,
    pub separator: String,
    pub padding: i64,
    pub next_number: i64,
    pub preview: String,
}

// ── Input DTOs ────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectInput {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectInput {
    pub id: i64,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlanInput {
    pub project_id: i64,
    pub name: String,
    pub feature_module: String,
    pub testing_goal: String,
    pub scope_in: String,
    pub scope_out: String,
    pub tester_name: String,
    pub start_date: String,
    pub end_date: String,
    pub test_environment: String,
    pub risks_notes: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCaseInput {
    pub test_case_id: String,
    pub title: String,
    pub case_type: String,
    pub related_feature: String,
    #[serde(default)]
    pub module_ids: Vec<i64>,
    #[serde(default)]
    pub linked_plan_ids: Vec<i64>,
    pub priority: String,
    pub preconditions: String,
    pub steps: String,
    pub test_data: String,
    pub expected_result: String,
    pub actual_result: String,
    pub status: String,
    pub bug_id_or_comments: String,
    pub notes: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTestResultInput {
    pub case_id: i64,
    pub plan_id: Option<i64>,
    pub result_status: String,
    pub tested_by: String,
    pub environment: String,
    pub tested_device: String,
    pub actual_result: String,
    pub bug_id_or_comments: String,
    pub attachments: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNamedOptionInput {
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNamedOptionInput {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateModuleInput {
    pub project_id: i64,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateModuleInput {
    pub id: i64,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTestCaseIdSettingsInput {
    pub prefix: String,
    pub separator: String,
    pub padding: i64,
    pub next_number: i64,
}
