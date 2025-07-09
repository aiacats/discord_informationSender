const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveManager {
    constructor() {
        this.drive = null;
        this.auth = null;
    }

    async authenticate() {
        try {
            const credentialsPath = path.join(__dirname, '../google-credentials.json');
            
            if (!fs.existsSync(credentialsPath)) {
                throw new Error('Google認証情報ファイル (google-credentials.json) が見つかりません。');
            }

            const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/drive']
            });

            this.drive = google.drive({ version: 'v3', auth: this.auth });
            
            return true;
        } catch (error) {
            console.error('Google Drive認証エラー:', error);
            return false;
        }
    }

    extractFolderIdFromUrl(url) {
        const patterns = [
            /\/folders\/([a-zA-Z0-9-_]+)/,
            /id=([a-zA-Z0-9-_]+)/,
            /\/d\/([a-zA-Z0-9-_]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }

    async createFolder(parentId, folderName) {
        try {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentId ? [parentId] : []
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                fields: 'id, name'
            });

            return response.data;
        } catch (error) {
            console.error('フォルダ作成エラー:', error);
            throw error;
        }
    }

    async createProjectStructure(parentFolderId, projectName, template) {
        const projectFolder = await this.createFolder(parentFolderId, projectName);
        
        async function createStructure(parentId, structure) {
            for (const item of structure) {
                if (item.type === 'folder') {
                    const folder = await this.createFolder(parentId, item.name);
                    if (item.children) {
                        await createStructure.call(this, folder.id, item.children);
                    }
                }
            }
        }

        await createStructure.call(this, projectFolder.id, template);
        
        return projectFolder;
    }

    async checkAccess(folderId) {
        try {
            await this.drive.files.get({
                fileId: folderId,
                fields: 'id, name'
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async scanFolderStructure(folderId, maxDepth = 5) {
        try {
            const folder = await this.drive.files.get({
                fileId: folderId,
                fields: 'id, name'
            });

            const structure = await this.getFolderContents(folderId, folder.data.name, 0, maxDepth);
            return structure;
        } catch (error) {
            console.error('フォルダスキャンエラー:', error);
            throw error;
        }
    }

    async getFolderContents(folderId, folderName, currentDepth, maxDepth) {
        if (currentDepth >= maxDepth) {
            return {
                name: folderName,
                type: 'folder',
                children: []
            };
        }

        const result = {
            name: folderName,
            type: 'folder',
            children: []
        };

        try {
            let pageToken = null;
            do {
                const response = await this.drive.files.list({
                    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                    fields: 'nextPageToken, files(id, name)',
                    pageToken: pageToken,
                    pageSize: 100
                });

                const folders = response.data.files || [];
                
                for (const folder of folders) {
                    const childStructure = await this.getFolderContents(
                        folder.id, 
                        folder.name, 
                        currentDepth + 1, 
                        maxDepth
                    );
                    result.children.push(childStructure);
                }

                pageToken = response.data.nextPageToken;
            } while (pageToken);

            // 子要素を名前順でソート
            result.children.sort((a, b) => a.name.localeCompare(b.name));

        } catch (error) {
            console.error(`フォルダ ${folderName} の内容取得エラー:`, error);
        }

        return result;
    }

    async saveCustomTemplate(templateName, structure) {
        try {
            const templatesPath = path.join(__dirname, '../data/templates.json');
            let templates = {};

            if (fs.existsSync(templatesPath)) {
                templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
            }

            templates[templateName] = {
                name: templateName,
                structure: structure.children || [],
                createdAt: new Date().toISOString()
            };

            fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
            return true;
        } catch (error) {
            console.error('テンプレート保存エラー:', error);
            return false;
        }
    }

    getAllTemplates() {
        try {
            // 統一されたテンプレートファイルを読み込み
            const templatesPath = path.join(__dirname, '../data/templates.json');
            
            if (!fs.existsSync(templatesPath)) {
                console.error('テンプレートファイルが見つかりません:', templatesPath);
                return {};
            }
            
            const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
            
            return templates;
        } catch (error) {
            console.error('テンプレート読み込みエラー:', error);
            return {};
        }
    }
}

module.exports = new GoogleDriveManager();