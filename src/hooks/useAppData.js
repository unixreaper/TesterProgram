import { useState, useCallback } from "react";

const invoke = globalThis.__TAURI__?.core?.invoke;

const DEFAULT_CASE_ID_SETTINGS = {
  prefix: "TC",
  suffix: "",
  length: 3,
  start_from: 1
};

export function useAppData() {
  const [projects, setProjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [projectModules, setProjectModules] = useState([]);
  const [cases, setCases] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [idPattern, setIdPattern] = useState(DEFAULT_CASE_ID_SETTINGS);

  const loadAll = useCallback(async () => {
    if (!invoke) return;
    try {
      const res = await invoke("load_dashboard_data");
      setProjects(res.projects || []);
      setProjectModules(res.modules || []);
      setPlans(res.plans || []);
      setCases(res.cases || []);
      setChecklists(res.checklists || []);
      setTestResults(res.testResults || []);
      setEnvironments(res.environments || []);
      setDevices(res.devices || []);

      const pattern = await invoke("get_test_case_id_settings");
      setIdPattern(pattern || DEFAULT_CASE_ID_SETTINGS);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return {
    projects, setProjects,
    plans, setPlans,
    projectModules, setProjectModules,
    cases, setCases,
    checklists, setChecklists,
    testResults, setTestResults,
    environments, setEnvironments,
    devices, setDevices,
    idPattern, setIdPattern,
    loadAll,
    invoke
  };
}
