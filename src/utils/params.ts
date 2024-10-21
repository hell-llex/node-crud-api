export const extractParamsFromUrl = (pathTemplate: string, actualPath: string): Record<string, string> => {
  const params: Record<string, string> = {};

  const templateParts = pathTemplate.split('/').filter(Boolean);
  const actualParts = actualPath.split('/').filter(Boolean);

  for (let i = 0; i < templateParts.length; i++) {
    if (templateParts[i].startsWith(':')) {
      const paramName = templateParts[i].slice(1);
      params[paramName] = actualParts[i];
    }
  }

  return params;
};