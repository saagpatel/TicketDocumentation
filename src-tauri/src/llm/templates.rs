use std::collections::HashMap;

pub const TEMPLATE_INCIDENT: &str = r#"You are an IT support engineer writing a resolution note for an incident ticket.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes what was done to resolve the incident
- Only mentions actions that appear in the activity summary above
- Uses professional IT support language
- Focuses on the resolution steps, not the problem description

Format: Start with "Performed troubleshooting:" or "Resolved incident by:"
"#;

pub const TEMPLATE_SERVICE_REQUEST: &str = r#"You are an IT support engineer writing a resolution note for a service request ticket.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes what was provisioned or configured
- Only mentions actions that appear in the activity summary above
- Uses professional IT support language
- Confirms successful completion

Format: Start with "Completed service request:" or "Provisioned:"
"#;

pub const TEMPLATE_CHANGE: &str = r#"You are an IT support engineer writing a resolution note for a change ticket.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes what was deployed or changed
- Only mentions actions that appear in the activity summary above
- Notes any validation or testing performed
- Uses professional IT support language

Format: Start with "Implemented change:" or "Deployed:"
"#;

pub const TEMPLATE_PROBLEM: &str = r#"You are an IT support engineer writing a resolution note for a problem investigation.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes the investigation performed
- Only mentions actions that appear in the activity summary above
- Notes findings or root cause if evident
- Uses professional IT support language

Format: Start with "Investigated issue:" or "Root cause analysis:"
"#;

pub const TEMPLATE_GENERIC: &str = r#"You are an IT support engineer writing a resolution note for a support ticket.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes what actions were performed
- Only mentions actions that appear in the activity summary above
- Uses professional IT support language
- Is suitable for pasting into {{app_context}}

Format: Start with "Performed:" or "Completed:"
"#;

pub fn get_template(template_id: &str) -> Option<&'static str> {
    match template_id {
        "incident" => Some(TEMPLATE_INCIDENT),
        "request" => Some(TEMPLATE_SERVICE_REQUEST),
        "change" => Some(TEMPLATE_CHANGE),
        "problem" => Some(TEMPLATE_PROBLEM),
        "generic" => Some(TEMPLATE_GENERIC),
        _ => None,
    }
}

pub fn render_template(template: &str, placeholders: &HashMap<String, String>) -> String {
    let mut result = template.to_string();

    for (key, value) in placeholders {
        let placeholder = format!("{{{{{}}}}}", key);
        result = result.replace(&placeholder, value);
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_template() {
        assert!(get_template("incident").is_some());
        assert!(get_template("request").is_some());
        assert!(get_template("nonexistent").is_none());
    }

    #[test]
    fn test_render_template() {
        let template = "Hello {{name}}, your ticket is {{status}}";
        let mut placeholders = HashMap::new();
        placeholders.insert("name".to_string(), "John".to_string());
        placeholders.insert("status".to_string(), "resolved".to_string());

        let result = render_template(template, &placeholders);
        assert_eq!(result, "Hello John, your ticket is resolved");
    }
}
