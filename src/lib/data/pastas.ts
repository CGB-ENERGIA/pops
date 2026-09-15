export interface Atalho {
	nome: string;
	descricao?: string;
	url: string;
}

// Edite esta lista para adicionar/trocar atalhos. Cada "url" é o link de
// compartilhamento de uma pasta do OneDrive/SharePoint (botão "Compartilhar"
// na própria pasta, com permissão "Qualquer pessoa com o link").
export const atalhos: Atalho[] = [
	{
		nome: 'Procedimentos Operacionais - CGB',
		descricao: 'GERE, GOMAN, GSTC, Trilha de Segurança e módulos do multiplicador',
		url: 'https://cgbengenharia-my.sharepoint.com/:f:/g/personal/rebeca_evelym_cgbengenharia_com_br/IgBQeWcgd-UmS649MIiNwjloAfg2eDLovu9PJYPrBXlS-QU?e=z3JRjZ'
	}
];
