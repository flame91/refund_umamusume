var queries = {};

queries.time_now = () => {
    return `SELECT date_format(NOW(), '%Y-%m-%d %H:%i:%S') as time_now;`;
};

/////////////////////////////////////////////////
// index.js
/////////////////////////////////////////////////
queries.select_crawl_target = () => {
    return `SELECT * FROM TB_CRAWL_TARGET WHERE is_used = 'Y';`;
};

queries.select_crawl_area = (seq_no) => {
    return `SELECT * FROM TB_CRAWL_AREA WHERE board_no = ${seq_no} LIMIT 1;`;
};

/////////////////////////////////////////////////
// scrap.js
/////////////////////////////////////////////////
queries.select_url = (url) => {
    return `SELECT COUNT(*) as cnt FROM TB_ARTICLE_LIST WHERE url = "${url}" LIMIT 1`;
};

// 게시물 - 내용
queries.insert_article = (
    community_name,
    board_name_en,
    id,
    url,
    title,
    content,
    thumbnail_src,
    reg_date,
    nickname,
    crawled_time
) => {
    return `INSERT INTO TB_ARTICLE_LIST VALUES (NULL, '${community_name}', '${board_name_en}', '${url}', '${title}', '${content}', '${thumbnail_src}', '${reg_date}', '${nickname}', '${crawled_time}', 0, 'N');`;
};

// 게시물 - 이미지
queries.insert_imgs = (article_no, order_no, src) => {
    return `INSERT INTO TB_IMG_LIST VALUES (NULL, ${article_no}, ${order_no}, "${src}");`;
};

queries.insert_comment = (article_no, order_no, id, content, reg_date) => {
    return `INSERT INTO TB_COMMENT_LIsT VALUES (NULL, ${article_no}, ${order_no}, "${id}", "${content}", "${reg_date}", 'N')`;
};

/////////////////////////////////////////////////
// 초기 생성
/////////////////////////////////////////////////

queries.create_tb_article_list = () => {
    return `CREATE TABLE araso_test.TB_ARTICLE_LIST (
	seq_no INT auto_increment NOT NULL,
	community_name varchar(10) NOT NULL,
	board_name_en varchar(20) NOT NULL,
    board_name_kr varchar(20) NOT NULL,
	url varchar(255) NOT NULL,
	title varchar(200) NOT NULL,
	content mediumtext NOT NULL,
	thumbnail_src varchar(500) NULL,
	reg_date varchar(30) NOT NULL,
	nickname varchar(30) NOT NULL,
	crawled_time varchar(20) NOT NULL,
	cnt INT NOT NULL,
	is_deleted char(1) NOT NULL,
	CONSTRAINT TB_ARTICLE_LIST_PK PRIMARY KEY (seq_no)
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_general_ci;`;
};

queries.create_tb_img_list = () => {
    return `CREATE TABLE araso_test.TB_IMG_LIST (
        seq_no INT auto_increment NOT NULL,
        article_no INT NOT NULL,
        order_no INT NOT NULL,
        src varchar(1000) NOT NULL,
        CONSTRAINT TB_IMG_LIST_PK PRIMARY KEY (seq_no)
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;
    `;
};

queries.create_tb_crawl_target = () => {
    return `CREATE TABLE araso_test.TB_CRAWL_TARGET (
        seq_no INT auto_increment NOT NULL,
        conmmunity_name varchar(10) NOT NULL,
        board_name varchar(20) NOT NULL,
        is_used char(1) DEFAULT 'Y' NOT NULL,
        url varchar(255) NOT NULL,
        crawl_period INT DEFAULT 10 NOT NULL,
        iteration_delay INT DEFAULT 5 NOT NULL,
        CONSTRAINT TB_CRAWL_TARGET_PK PRIMARY KEY (seq_no)
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;
    `;
};

queries.create_tb_crawl_area = () => {
    return `CREATE TABLE araso_test.TB_CRAWL_AREA (
        board_no INT NOT NULL,
        list_area varchar(100) NOT NULL,
        title_area varchar(100) NOT NULL,
        content_area varchar(100) NOT NULL,
        reg_date_area varchar(100) NOT NULL,
        reg_date_format varchar(100) NOT NULL,
        nickname_area varchar(100) NOT NULL,
        img_url_conversion varchar(100) NULL,
        CONSTRAINT TB_CRAWL_AREA_PK PRIMARY KEY (board_no)
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;
    `;
};

queries.create_tb_comment_list = () => {
    return `CREATE TABLE araso_test.TB_COMMENT_LIST (
        seq_no INT auto_increment NOT NULL,
        article_no INT NOT NULL,
        order_no INT NOT NULL,
        id varchar(20) NOT NULL,
        content varchar(500) NOT NULL,
        reg_date varchar(20) NOT NULL,
        is_deleted char(1) NOT NULL,
        CONSTRAINT TB_COMMENT_LIST_PK PRIMARY KEY (seq_no)
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;    
    `;
};

module.exports = queries;
