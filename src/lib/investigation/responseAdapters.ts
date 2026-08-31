export type ResponseActionName =
  | "Isolate Host"
  | "Disable Account"
  | "Block IOC"
  | "Collect Memory";

export interface ResponseAdapterInput {
  name: string;
  target: string;
  description: string;
}

export interface ResponseAdapterResult {
  success: boolean;
  provider: string;
  message: string;
}

export async function executeResponseAction(
  input: ResponseAdapterInput,
): Promise<ResponseAdapterResult> {
  switch (input.name as ResponseActionName) {
    case "Isolate Host":
      return {
        success: true,
        provider: "SOC Lab Containment Adapter",
        message: `Containment request accepted for ${input.target}.`,
      };

    case "Disable Account":
      return {
        success: true,
        provider: "SOC Lab Identity Adapter",
        message: `Account containment request accepted for ${input.target}.`,
      };

    case "Block IOC":
      return {
        success: true,
        provider: "SOC Lab IOC Adapter",
        message: `IOC block request accepted for ${input.target}.`,
      };

    case "Collect Memory":
      return {
        success: true,
        provider: "SOC Lab Forensics Adapter",
        message: `Memory acquisition request accepted for ${input.target}.`,
      };

    default:
      return {
        success: false,
        provider: "SOC Lab Response Adapter",
        message: `Unsupported response action: ${input.name}.`,
      };
  }
}
