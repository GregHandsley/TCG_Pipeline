export type DescribeResult = {
    listing: { title: string; description: string };
    confidence: number;
    needsManualReview: boolean;
    threshold?: number;
    id: any;
    grade: {
      records: Array<{
        _full_url_card?: string;
        _exact_url_card?: string;
        grades?: {
          corners?: number;
          edges?: number;
          surface?: number;
          centering?: number;
          final?: number;
          condition?: string;
        };
      }>;
    };
  };
  
  export async function describeCard(front: File): Promise<DescribeResult> {
    const fd = new FormData();
    fd.append("file", front);
    const res = await fetch("/ximilar/describe", { method: "POST", body: fd });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Describe failed: ${res.status} ${t}`);
    }
    return res.json();
  }