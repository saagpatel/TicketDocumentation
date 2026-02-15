use regex::Regex;
use std::sync::OnceLock;

// Compiled regex patterns (lazy initialization)
// SAFETY: All regex patterns below are hardcoded string literals that are guaranteed to be valid.
// Using unwrap() here is safe because these patterns never change and are tested.
fn credit_card_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        Regex::new(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b").unwrap()
    })
}

fn ssn_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        Regex::new(r"\b\d{3}-\d{2}-\d{4}\b").unwrap()
    })
}

fn email_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        Regex::new(r"\b[\w.-]+@[\w.-]+\.\w+\b").unwrap()
    })
}

fn account_number_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        Regex::new(r"(?i)(account|acct|#)\s*\d{4,}\b").unwrap()
    })
}

fn phone_number_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        // Match phone numbers with optional country code and various formats
        Regex::new(r"(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b").unwrap()
    })
}

/// Sanitize window title by redacting PII
pub fn sanitize_title(title: &str) -> String {
    let mut sanitized = title.to_string();

    // Apply each regex replacement
    sanitized = credit_card_regex().replace_all(&sanitized, "[REDACTED]").to_string();
    sanitized = ssn_regex().replace_all(&sanitized, "[REDACTED]").to_string();
    sanitized = email_regex().replace_all(&sanitized, "[REDACTED]").to_string();
    sanitized = account_number_regex().replace_all(&sanitized, "[REDACTED]").to_string();
    sanitized = phone_number_regex().replace_all(&sanitized, "[REDACTED]").to_string();

    sanitized
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_credit_card_redaction() {
        assert_eq!(
            sanitize_title("Card: 1234 5678 9012 3456"),
            "Card: [REDACTED]"
        );
        assert_eq!(
            sanitize_title("Card: 1234-5678-9012-3456"),
            "Card: [REDACTED]"
        );
    }

    #[test]
    fn test_ssn_redaction() {
        assert_eq!(
            sanitize_title("SSN: 123-45-6789"),
            "SSN: [REDACTED]"
        );
    }

    #[test]
    fn test_email_redaction() {
        assert_eq!(
            sanitize_title("Contact: user@example.com"),
            "Contact: [REDACTED]"
        );
    }

    #[test]
    fn test_account_number_redaction() {
        assert_eq!(
            sanitize_title("Chase Checking #1234567"),
            "Chase Checking [REDACTED]"
        );
        assert_eq!(
            sanitize_title("Account 98765432"),
            "[REDACTED]"
        );
    }

    #[test]
    fn test_phone_redaction() {
        assert_eq!(
            sanitize_title("Call: (555) 123-4567"),
            "Call: [REDACTED]"
        );
        assert_eq!(
            sanitize_title("Phone: 555-123-4567"),
            "Phone: [REDACTED]"
        );
    }

    #[test]
    fn test_no_false_positives() {
        // Should not redact normal text
        assert_eq!(
            sanitize_title("Server Down - Chrome"),
            "Server Down - Chrome"
        );
    }
}
