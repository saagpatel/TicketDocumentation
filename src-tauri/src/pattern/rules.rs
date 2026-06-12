use regex::Regex;
use std::sync::OnceLock;

pub struct PatternRule {
    pub name: String,
    pub category: String,
    pub app_regex: Regex,
    pub title_regex: Option<Regex>,
}

impl PatternRule {
    fn new(name: &str, category: &str, app_pattern: &str, title_pattern: Option<&str>) -> Self {
        Self {
            name: name.to_string(),
            category: category.to_string(),
            // SAFETY: These patterns are hardcoded string literals in get_rules() and are guaranteed to be valid regex.
            // They are tested in the test suite and only compiled once at startup.
            app_regex: Regex::new(app_pattern).expect("hardcoded regex pattern should be valid"),
            title_regex: title_pattern
                .map(|p| Regex::new(p).expect("hardcoded regex pattern should be valid")),
        }
    }

    fn matches(&self, app_name: &str, title: &str) -> bool {
        if !self.app_regex.is_match(app_name) {
            return false;
        }

        if let Some(ref title_regex) = self.title_regex {
            title_regex.is_match(title)
        } else {
            true
        }
    }
}

fn get_rules() -> &'static Vec<PatternRule> {
    static RULES: OnceLock<Vec<PatternRule>> = OnceLock::new();
    RULES.get_or_init(|| {
        vec![
            // Incident: ticketing apps with incident-related keywords
            PatternRule::new(
                "incident",
                "incident",
                r"(?i)(jira|servicenow|zendesk|freshdesk|pagerduty)",
                Some(r"(?i)(incident|INC|bug|error|crash|outage|down|fail)"),
            ),
            // Service Request: ticketing apps with request-related keywords
            PatternRule::new(
                "service_request",
                "request",
                r"(?i)(jira|servicenow|zendesk|freshdesk)",
                Some(r"(?i)(request|REQ|new.*ticket|order|provision)"),
            ),
            // Change: ticketing apps with change-related keywords
            PatternRule::new(
                "change",
                "change",
                r"(?i)(jira|servicenow|zendesk)",
                Some(r"(?i)(change|CHG|deploy|release|maintenance|upgrade)"),
            ),
            // Problem: ticketing apps with problem investigation keywords
            PatternRule::new(
                "problem",
                "problem",
                r"(?i)(jira|servicenow|zendesk)",
                Some(r"(?i)(problem|PRB|root.cause|investigation|postmortem)"),
            ),
            // How-to/Documentation: documentation tools and wikis
            PatternRule::new(
                "how_to",
                "how-to",
                r".*",
                Some(r"(?i)(how.to|guide|tutorial|documentation|wiki|confluence|notion)"),
            ),
            // App Installation: self-service tools and installers
            PatternRule::new(
                "app_installation",
                "app-install",
                r"(?i)(self.service|munki|app.store|jamf)",
                None,
            ),
            // App Installation: .dmg or .pkg files
            PatternRule::new(
                "app_installer_file",
                "app-install",
                r".*",
                Some(r"(?i)\.dmg|\.pkg|installer"),
            ),
        ]
    })
}

/// Detect the category of an activity based on app name and window title
pub fn detect_category(app_name: &str, title: &str) -> Option<String> {
    let rules = get_rules();

    for rule in rules {
        if rule.matches(app_name, title) {
            return Some(rule.category.clone());
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_incident_detection() {
        assert_eq!(
            detect_category("Jira", "INC-1234 Server Down"),
            Some("incident".to_string())
        );
        assert_eq!(
            detect_category("ServiceNow", "Critical Bug - Application Crash"),
            Some("incident".to_string())
        );
    }

    #[test]
    fn test_service_request_detection() {
        assert_eq!(
            detect_category("Jira", "REQ-5678 New Laptop Request"),
            Some("request".to_string())
        );
        assert_eq!(
            detect_category("Zendesk", "Order New Equipment"),
            Some("request".to_string())
        );
    }

    #[test]
    fn test_change_detection() {
        assert_eq!(
            detect_category("ServiceNow", "CHG-9012 Production Deployment"),
            Some("change".to_string())
        );
    }

    #[test]
    fn test_problem_detection() {
        assert_eq!(
            detect_category("Jira", "PRB-3456 Root Cause Analysis"),
            Some("problem".to_string())
        );
    }

    #[test]
    fn test_how_to_detection() {
        assert_eq!(
            detect_category("Chrome", "How to Configure VPN - Confluence"),
            Some("how-to".to_string())
        );
        assert_eq!(
            detect_category("Safari", "Documentation Wiki"),
            Some("how-to".to_string())
        );
    }

    #[test]
    fn test_app_installation_detection() {
        assert_eq!(
            detect_category("Self Service", "Available Apps"),
            Some("app-install".to_string())
        );
        assert_eq!(
            detect_category("Finder", "Slack.dmg"),
            Some("app-install".to_string())
        );
    }

    #[test]
    fn test_no_category_match() {
        assert_eq!(detect_category("Chrome", "Google Search"), None);
    }

    #[test]
    fn test_priority_first_match_wins() {
        // Should match "incident" first (before "request")
        assert_eq!(
            detect_category("Jira", "Bug in New Feature Request"),
            Some("incident".to_string())
        );
    }
}
