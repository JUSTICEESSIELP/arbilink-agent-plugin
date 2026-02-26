// Utility function to format errors
export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

// Utility function to fetch discovery resources
export async function fetchDiscoveryResources(apiEndpoint: string): Promise<any> {
  try {
    console.log(`Fetching resources from: ${apiEndpoint}`);
    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched resources`);
    return data;
  } catch (error) {
    console.error(`Error fetching discovery resources: ${formatError(error)}`);
    throw new Error(`Failed to fetch discovery resources: ${formatError(error)}`);
  }
}

// Format the discovery resources for display
export function formatDiscoveryResources(data: any): string {
  try {
    if (!data || typeof data !== "object") {
      return "No discovery resources found.";
    }

    // Extract resources from the response
    // Handle various API response formats
    const resources = data.resources || data.data || data.items || data.results || (data.response && data.response.data) || (Array.isArray(data) ? data : []);

    if (!Array.isArray(resources) || resources.length === 0) {
      return "No discovery resources found.";
    }

    // Format the resources as a string
    let result = "## X402 Discovery Resources\n\n";

    resources.forEach((resource: any, index: number) => {
      // Extract resource information
      const resourceUrl = resource.resource || "";
      const resourceType = resource.type || "Unknown";
      const lastUpdated = resource.lastUpdated ? new Date(resource.lastUpdated).toLocaleString() : "Unknown";

      // Get accepts information if available
      let description = "No description available";
      if (resource.accepts && Array.isArray(resource.accepts) && resource.accepts.length > 0) {
        const acceptInfo = resource.accepts[0];
        description = acceptInfo.description || description;
      }

      result += `### Resource ${index + 1}\n`;
      result += `- **URL**: ${resourceUrl}\n`;
      result += `- **Type**: ${resourceType}\n`;
      result += `- **Last Updated**: ${lastUpdated}\n`;
      result += `- **Description**: ${description}\n\n`;

      // Add additional details if accepts array is available
      if (resource.accepts && Array.isArray(resource.accepts) && resource.accepts.length > 0) {
        const acceptInfo = resource.accepts[0];

        if (acceptInfo.network) {
          result += `  **Network**: ${acceptInfo.network}\n`;
        }

        if (acceptInfo.mimeType) {
          result += `  **MIME Type**: ${acceptInfo.mimeType}\n`;
        }

        if (acceptInfo.scheme) {
          result += `  **Scheme**: ${acceptInfo.scheme}\n`;
        }

        if (acceptInfo.maxTimeoutSeconds) {
          result += `  **Max Timeout**: ${acceptInfo.maxTimeoutSeconds} seconds\n`;
        }

        if (acceptInfo.maxAmountRequired) {
          result += `  **Max Amount Required**: ${acceptInfo.maxAmountRequired}\n`;
        }

        if (acceptInfo.payTo) {
          result += `  **Pay To**: ${acceptInfo.payTo}\n`;
        }

        result += `\n`;
      }
    });

    return result;
  } catch (error) {
    return `Error formatting discovery resources: ${formatError(error)}`;
  }
}
