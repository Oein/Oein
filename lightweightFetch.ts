/* eslint-disable @typescript-eslint/no-explicit-any */
interface Response {
	data: any;
	status: number;
	headers?: Headers;
}

interface RequestOptions {
	endpoint: string;
	body?: any;
	method?: string;
	headers?: { [key: string]: string };
	returnType?: 'blob' | 'arraybuffer' | 'raw' | 'text' | 'text_json';
}

class Requester {
	async request(endpoint: string): Promise<Response>;
	async request(req: RequestOptions): Promise<Response>;
	async request(endpoint: string, req: Omit<RequestOptions, 'endpoint'>): Promise<Response>;
	async request(
		req_or_end: RequestOptions | string,
		opt_req?: Omit<RequestOptions, 'endpoint'>
	): Promise<Response> {
		let req: RequestOptions;

		if (typeof req_or_end === 'string' && typeof opt_req == 'undefined')
			req = {
				endpoint: req_or_end as string
			};
		else if (typeof req_or_end === 'string' && typeof opt_req != 'undefined')
			req = {
				...opt_req,
				endpoint: req_or_end as string
			};
		else req = req_or_end as RequestOptions;

		const hasBody = typeof req.body != 'undefined';
		const config: RequestInit = {};
		if (hasBody) {
			if (typeof req.body == 'object') config.body = JSON.stringify(req.body);
			else config.body = req.body;
		}
		config.method = req.method || 'GET';
		config.headers = {
			accept: 'application/json',
			'Content-Type': 'application/json',
			...(req.headers || {})
		};
		const res = await fetch(req.endpoint, config);
		const base = {
			status: res.status,
			headers: res.headers
		};
		if (req.returnType == 'raw')
			return {
				data: res,
				...base
			};
		if (req.returnType === 'blob')
			return {
				data: await res.blob(),
				status: res.status,
				headers: res.headers
			};
		if (req.returnType == 'arraybuffer')
			return {
				data: await res.arrayBuffer(),
				...base
			};
		if (req.returnType == 'text')
			return {
				data: await res.text(),
				...base
			};
		const t = await res.text();
		try {
			return {
				data: JSON.parse(t),
				...base
			};
		} catch (e) {
			return {
				data: t,
				...base
			};
		}
	}

	async post(endpoint: string): Promise<Response>;
	async post(
		endpoint: string,
		postReq: Omit<Omit<RequestOptions, 'method'>, 'endpoint'>
	): Promise<Response>;
	async post(postReq: Omit<RequestOptions, 'method'>): Promise<Response>;
	async post(
		postReq: Omit<RequestOptions, 'method'> | string,
		postReqOpt?: Omit<Omit<RequestOptions, 'method'>, 'endpoint'>
	) {
		let req: RequestOptions;

		if (typeof postReq == 'string')
			req = {
				...(postReqOpt || {}),
				endpoint: postReq,
				method: 'POST'
			};
		else
			req = {
				...postReq,
				method: 'POST'
			};
		return await this.request(req);
	}

	async get(endpoint: string): Promise<Response>;
	async get(
		endpoint: string,
		postReq: Omit<Omit<RequestOptions, 'method'>, 'endpoint'>
	): Promise<Response>;
	async get(postReq: Omit<RequestOptions, 'method'>): Promise<Response>;
	async get(
		postReq: Omit<RequestOptions, 'method'> | string,
		postReqOpt?: Omit<Omit<RequestOptions, 'method'>, 'endpoint'>
	) {
		let req: RequestOptions;

		if (typeof postReq == 'string')
			req = {
				...(postReqOpt || {}),
				endpoint: postReq,
				method: 'GET'
			};
		else
			req = {
				...postReq,
				method: 'GET'
			};
		return await this.request(req);
	}
}

type RequesterInstance = ((req: RequestOptions) => Promise<Response>) &
	((endpoint: string) => Promise<Response>) &
	((endpoint: string, req: Omit<RequestOptions, 'endpoint'>) => Promise<Response>) &
	Requester;

const createInstance = (): RequesterInstance => {
	const instance = new Requester();
	return Object.assign(instance.request, instance);
};

const fetcher = createInstance();
export default fetcher;
