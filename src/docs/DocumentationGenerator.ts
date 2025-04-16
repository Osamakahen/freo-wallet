import fs from 'fs';
import path from 'path';
import ts from 'typescript';

interface DocumentationOptions {
  outputDir: string;
  includePrivate?: boolean;
  format?: 'markdown' | 'html';
}

interface DocumentationItem {
  name: string;
  type: string;
  description?: string;
  parameters?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  returnType?: string;
  returnDescription?: string;
  isPrivate?: boolean;
}

export class DocumentationGenerator {
  private options: DocumentationOptions;
  private program: ts.Program;
  private checker: ts.TypeChecker;

  constructor(options: DocumentationOptions) {
    this.options = {
      includePrivate: false,
      format: 'markdown',
      ...options,
    };

    // Initialize TypeScript program
    const configPath = ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists,
      'tsconfig.json'
    );

    if (!configPath) {
      throw new Error('Could not find tsconfig.json');
    }

    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      path.dirname(configPath)
    );

    this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
    this.checker = this.program.getTypeChecker();
  }

  private getDocumentationForNode(node: ts.Node): DocumentationItem | null {
    if (!ts.isClassDeclaration(node) && !ts.isInterfaceDeclaration(node)) {
      return null;
    }

    const symbol = this.checker.getSymbolAtLocation(node.name!);
    if (!symbol) return null;

    const documentation = ts.displayPartsToString(
      symbol.getDocumentationComment(this.checker)
    );

    const isPrivate = node.modifiers?.some(
      (m) => m.kind === ts.SyntaxKind.PrivateKeyword
    );

    if (isPrivate && !this.options.includePrivate) {
      return null;
    }

    const item: DocumentationItem = {
      name: node.name!.getText(),
      type: ts.isClassDeclaration(node) ? 'class' : 'interface',
      description: documentation,
      isPrivate,
    };

    if (ts.isClassDeclaration(node)) {
      const methods = node.members.filter(ts.isMethodDeclaration);
      item.parameters = methods.map((method) => {
        const methodSymbol = this.checker.getSymbolAtLocation(method.name);
        const methodDoc = methodSymbol
          ? ts.displayPartsToString(
              methodSymbol.getDocumentationComment(this.checker)
            )
          : '';

        return {
          name: method.name.getText(),
          type: this.checker.typeToString(
            this.checker.getTypeAtLocation(method)
          ),
          description: methodDoc,
        };
      });
    }

    return item;
  }

  private generateMarkdown(items: DocumentationItem[]): string {
    let markdown = '# API Documentation\n\n';

    items.forEach((item) => {
      markdown += `## ${item.name}\n\n`;
      markdown += `**Type:** ${item.type}\n\n`;

      if (item.description) {
        markdown += `${item.description}\n\n`;
      }

      if (item.parameters?.length) {
        markdown += '### Methods\n\n';
        markdown += '| Name | Type | Description |\n';
        markdown += '|------|------|-------------|\n';

        item.parameters.forEach((param) => {
          markdown += `| ${param.name} | ${param.type} | ${param.description || ''} |\n`;
        });

        markdown += '\n';
      }
    });

    return markdown;
  }

  public generate(sourceFiles: string[]): void {
    const documentationItems: DocumentationItem[] = [];

    sourceFiles.forEach((file) => {
      const sourceFile = this.program.getSourceFile(file);
      if (!sourceFile) return;

      ts.forEachChild(sourceFile, (node) => {
        const docItem = this.getDocumentationForNode(node);
        if (docItem) {
          documentationItems.push(docItem);
        }
      });
    });

    const output = this.options.format === 'markdown'
      ? this.generateMarkdown(documentationItems)
      : this.generateHTML(documentationItems);

    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    const outputFile = path.join(
      this.options.outputDir,
      `api-documentation.${this.options.format}`
    );

    fs.writeFileSync(outputFile, output);
  }

  private generateHTML(items: DocumentationItem[]): string {
    // Basic HTML template for documentation
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>API Documentation</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            h2 { color: #444; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f5f5f5; }
            .description { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>API Documentation</h1>
          ${items.map(item => `
            <h2>${item.name}</h2>
            <p><strong>Type:</strong> ${item.type}</p>
            ${item.description ? `<div class="description">${item.description}</div>` : ''}
            ${item.parameters?.length ? `
              <h3>Methods</h3>
              <table>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
                ${item.parameters.map(param => `
                  <tr>
                    <td>${param.name}</td>
                    <td>${param.type}</td>
                    <td>${param.description || ''}</td>
                  </tr>
                `).join('')}
              </table>
            ` : ''}
          `).join('')}
        </body>
      </html>
    `;
  }
} 